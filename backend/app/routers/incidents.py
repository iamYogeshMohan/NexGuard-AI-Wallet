"""
NexGuard Secure Wallet — Incidents Router
GET    /api/incidents
GET    /api/incidents/{id}
POST   /api/incidents/{id}/resolve
POST   /api/incidents/{id}/override
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Incident, IncidentEvent, Transaction
from ..schemas import IncidentResolveRequest, AnalystOverrideRequest
from ..websocket import manager, WSEvents
from ..audit import write_audit_log, AuditActions
from ..security import require_analyst

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


def _serialize_incident(i: Incident) -> dict:
    return {
        "id": i.id,
        "incident_id": i.incident_id,
        "transaction_id_str": i.transaction_id_str,
        "user_id": i.user_id,
        "device_id": i.device_id,
        "title": i.title,
        "severity": i.severity,
        "status": i.status,
        "description": i.description,
        "risk_score": i.risk_score,
        "agent_evidence": i.agent_evidence or {},
        "xai_factors": i.xai_factors or [],
        "analyst_notes": i.analyst_notes,
        "analyst_action": i.analyst_action,
        "override_reason": i.override_reason,
        "created_at": i.created_at.isoformat() if i.created_at else None,
        "updated_at": i.updated_at.isoformat() if i.updated_at else None,
        "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
        "events": [
            {
                "event_type": e.event_type,
                "actor": e.actor,
                "description": e.description,
                "created_at": e.created_at.isoformat(),
            }
            for e in (i.events or [])
        ],
    }


@router.get("")
def get_incidents(
    status: str = None,
    severity: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status.upper())
    if severity:
        query = query.filter(Incident.severity == severity.upper())
    incidents = query.order_by(Incident.created_at.desc()).limit(limit).all()
    return [_serialize_incident(i) for i in incidents]


@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    i = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Incident not found")
    return _serialize_incident(i)


@router.post("/{incident_id}/resolve")
async def resolve_incident(
    incident_id: str,
    req: IncidentResolveRequest = IncidentResolveRequest(),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "RESOLVED"
    incident.resolved_at = datetime.utcnow()
    incident.analyst_notes = req.notes or "Resolved by SOC analyst via NexGuard Command Console."

    db.add(IncidentEvent(
        incident_id_fk=incident.id,
        event_type="STATUS_CHANGE",
        actor="SOC_ANALYST",
        description=f"Incident resolved. Notes: {incident.analyst_notes}",
    ))

    write_audit_log(
        db, action=AuditActions.INCIDENT_RESOLVED,
        resource_type="INCIDENT", resource_id=incident_id,
        description=f"Incident {incident_id} resolved by analyst."
    )
    db.commit()

    await manager.broadcast_soc({
        "type": WSEvents.INCIDENT_RESOLVED,
        "data": {"incident_id": incident_id, "status": "RESOLVED"}
    })

    return {"message": f"Incident {incident_id} resolved.", "incident_id": incident_id}


@router.post("/{incident_id}/override")
async def analyst_override(
    incident_id: str,
    req: AnalystOverrideRequest,
    db: Session = Depends(get_db)
):
    """
    SOC Analyst Override: KEEP_BLOCKED or APPROVE_OVERRIDE.
    Every override creates an immutable audit record.
    The original AI decision is NEVER deleted.
    """
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if req.action not in ("KEEP_BLOCKED", "APPROVE_OVERRIDE"):
        raise HTTPException(status_code=400, detail="action must be KEEP_BLOCKED or APPROVE_OVERRIDE")

    incident.analyst_action = req.action
    incident.override_reason = req.reason

    if req.action == "APPROVE_OVERRIDE":
        incident.status = "FALSE_POSITIVE"
        # If override approved, release the transaction
        if incident.transaction_id_str:
            txn = db.query(Transaction).filter(
                Transaction.transaction_id_str == incident.transaction_id_str
            ).first()
            if txn and txn.status == "BLOCKED":
                txn.status = "ALLOW"
                # Note: We deliberately do NOT debit the wallet here automatically
                # — that requires explicit confirmation per RBAC policy

    db.add(IncidentEvent(
        incident_id_fk=incident.id,
        event_type="ANALYST_ACTION",
        actor="SOC_ANALYST",
        description=f"Analyst override: {req.action}. Reason: {req.reason}",
        event_metadata={"action": req.action, "reason": req.reason}
    ))

    write_audit_log(
        db, action=AuditActions.ANALYST_OVERRIDE,
        resource_type="INCIDENT", resource_id=incident_id,
        description=f"Analyst override on {incident_id}: {req.action}. Reason: {req.reason}",
        metadata={"action": req.action, "original_decision": "BLOCK", "reason": req.reason}
    )
    db.commit()

    await manager.broadcast_soc({
        "type": "ANALYST_OVERRIDE",
        "data": {
            "incident_id": incident_id,
            "action": req.action,
            "reason": req.reason,
        }
    })

    return {
        "incident_id": incident_id,
        "action": req.action,
        "message": f"Analyst override recorded. Original AI decision preserved in audit log.",
    }
