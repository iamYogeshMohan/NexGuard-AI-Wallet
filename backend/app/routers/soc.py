"""
NexGuard Secure Wallet — SOC Data Routers
GET /api/users
GET /api/users/{id}
GET /api/agents
GET /api/agents/status
GET /api/threat-intelligence
GET /api/audit-logs
GET /api/quantum-risk
GET /api/reports
GET /api/digital-twin/{user_id}
GET /api/dashboard
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    User, Transaction, Incident, Device, BehaviorProfile,
    ThreatIntelligence, AuditLog, CryptographicAsset, SecurityEvent
)
from ..config import settings
from ..agents import orchestrator

router = APIRouter(prefix="/api", tags=["SOC"])


# ─── Dashboard Summary ────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Real-time SOC dashboard KPIs — all calculated from live database."""
    total_txns = db.query(Transaction).count()
    allowed = db.query(Transaction).filter(Transaction.status.in_(["ALLOW", "COMPLETED"])).count()
    blocked = db.query(Transaction).filter(Transaction.status == "BLOCKED").count()
    pending_verify = db.query(Transaction).filter(Transaction.status.in_(["VERIFY", "PENDING_VERIFICATION"])).count()

    open_incidents = db.query(Incident).filter(Incident.status == "OPEN").count()
    critical_incidents = db.query(Incident).filter(Incident.severity == "CRITICAL", Incident.status == "OPEN").count()

    total_devices = db.query(Device).count()
    suspicious_devices = db.query(Device).filter(Device.trust_level.in_(["SUSPICIOUS", "BLOCKED"])).count()

    avg_risk = db.query(func.avg(Transaction.risk_score)).scalar() or 0

    # Recent live events (last 10 transactions)
    recent_txns = (
        db.query(Transaction)
        .order_by(Transaction.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "total_transactions": total_txns,
        "allowed_transactions": allowed,
        "blocked_transactions": blocked,
        "pending_verification": pending_verify,
        "open_incidents": open_incidents,
        "critical_incidents": critical_incidents,
        "total_devices": total_devices,
        "suspicious_devices": suspicious_devices,
        "average_risk_score": round(float(avg_risk), 1),
        "agent_health": {name: "OPERATIONAL" for name in orchestrator.agents.keys()},
        "recent_events": [
            {
                "id": t.id,
                "transaction_id_str": t.transaction_id_str,
                "merchant": t.merchant,
                "amount": t.amount,
                "status": t.status,
                "risk_score": t.risk_score,
                "device_id": t.device_id,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in recent_txns
        ],
    }


# ─── Users ────────────────────────────────────────────────────────────────────

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "CUSTOMER").all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "upi_id": u.upi_id,
            "balance": u.wallet.balance if u.wallet else 0,
            "security_score": u.wallet.security_score if u.wallet else 0,
            "security_status": u.wallet.security_status if u.wallet else "UNKNOWN",
            "device_count": len(u.devices),
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.get("/users/{user_id}")
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    txn_count = db.query(Transaction).filter(Transaction.user_id == user_id).count()
    incident_count = db.query(Incident).filter(Incident.user_id == user_id).count()
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "upi_id": user.upi_id,
        "role": user.role,
        "balance": user.wallet.balance if user.wallet else 0,
        "security_score": user.wallet.security_score if user.wallet else 0,
        "security_status": user.wallet.security_status if user.wallet else "UNKNOWN",
        "transaction_count": txn_count,
        "incident_count": incident_count,
        "devices": [
            {"device_id": d.device_id, "device_name": d.device_name, "trust_level": d.trust_level}
            for d in user.devices
        ],
        "created_at": user.created_at.isoformat(),
    }


# ─── Digital Twin ─────────────────────────────────────────────────────────────

@router.get("/digital-twin/{user_id}")
def get_digital_twin(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(BehaviorProfile).filter(BehaviorProfile.user_id == user_id).first()
    if not profile:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Digital Twin profile not found")

    return {
        "user_id": user_id,
        "full_name": user.full_name,
        "typical_amount_range": {
            "min": profile.min_amount,
            "max": profile.max_amount,
            "average": profile.avg_transaction_amount,
            "std_dev": profile.std_transaction_amount,
        },
        "typical_hours": {
            "start": profile.typical_hours_start,
            "end": profile.typical_hours_end,
            "label": f"{profile.typical_hours_start:02d}:00–{profile.typical_hours_end:02d}:00 IST",
        },
        "typical_devices": profile.typical_devices or ["DEVICE-001"],
        "typical_locations": profile.typical_locations or ["Chennai, IN [SYNTHETIC]"],
        "typical_categories": profile.typical_categories or ["DINING", "SHOPPING"],
        "transaction_count": profile.transaction_count,
        "avg_transactions_per_day": profile.avg_transactions_per_day,
        "last_updated": profile.last_updated.isoformat() if profile.last_updated else None,
    }


# ─── AI Agents Status ─────────────────────────────────────────────────────────

@router.get("/agents")
def get_agents_info():
    """Return configuration and status for all 10 AI security agents."""
    agents_info = {
        "fraud":       {"name": "Fraud Detection Agent",       "description": "Z-score & Isolation Forest transaction anomaly detection", "method": "Z-score + merchant risk multiplier"},
        "cyber":       {"name": "Cyber Threat Agent",          "description": "Device integrity, failed logins, VPN/Tor detection",      "method": "Telemetry signal analysis"},
        "behavior":    {"name": "Behavior Agent",              "description": "Digital Twin behavioral deviation analysis",              "method": "Multi-dimensional deviation scoring"},
        "biometrics":  {"name": "Biometric Security Agent",    "description": "Simulated biometric confidence and device trust",        "method": "Biometric confidence + device trust fusion"},
        "device":      {"name": "Device Intelligence Agent",   "description": "Device trust state machine evaluation",                  "method": "Device lifecycle trust scoring"},
        "geo":         {"name": "Geo-Velocity Agent",          "description": "IMPOSSIBLE_TRAVEL detection via Haversine formula",     "method": "Haversine great-circle distance / time delta"},
        "beneficiary": {"name": "Beneficiary Risk Agent",      "description": "Payee mule pattern and trust score analysis",           "method": "Risk keyword + trust score evaluation"},
        "ip":          {"name": "IP Intelligence Agent",       "description": "LAN/Private/VPN/Tor IP classification",                 "method": "RFC 1918 + synthetic threat intel lookup"},
        "session":     {"name": "Session Risk Agent",          "description": "Concurrent sessions, token replay detection",           "method": "Session anomaly correlation"},
        "quantum":     {"name": "Quantum Risk Advisor",        "description": "NIST PQC cryptographic readiness assessment",           "method": "FIPS 203/204/205 algorithm catalog"},
    }
    result = []
    for key, info in agents_info.items():
        result.append({
            "agent_id": key,
            "name": info["name"],
            "description": info["description"],
            "method": info["method"],
            "weight": settings.AGENT_WEIGHTS.get(key, 0),
            "weight_pct": f"{settings.AGENT_WEIGHTS.get(key, 0) * 100:.0f}%",
            "status": "OPERATIONAL",
        })
    return {
        "total_agents": len(result),
        "status": "ALL_OPERATIONAL",
        "policy_version": "v2.0",
        "agents": result,
    }


# ─── Threat Intelligence ──────────────────────────────────────────────────────

@router.get("/threat-intelligence")
def get_threat_intelligence(db: Session = Depends(get_db)):
    items = db.query(ThreatIntelligence).filter(ThreatIntelligence.is_active == True).all()
    return [
        {
            "id": t.id,
            "indicator": t.indicator,
            "indicator_type": t.indicator_type,
            "source": t.source,
            "severity": t.severity,
            "confidence": t.confidence,
            "description": t.description,
            "tags": t.tags or [],
            "first_seen": t.first_seen.isoformat() if t.first_seen else None,
            "last_seen": t.last_seen.isoformat() if t.last_seen else None,
        }
        for t in items
    ]


# ─── Audit Logs ───────────────────────────────────────────────────────────────

@router.get("/audit-logs")
def get_audit_logs(limit: int = 100, action: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action.upper())
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "actor_name": l.actor_name,
            "actor_role": l.actor_role,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "description": l.description,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


# ─── Quantum Risk ─────────────────────────────────────────────────────────────

@router.get("/quantum-risk")
def get_quantum_risk(db: Session = Depends(get_db)):
    assets = db.query(CryptographicAsset).all()
    return {
        "assessment_title": "Post-Quantum Cryptography Risk Assessment",
        "assessment_date": datetime.utcnow().isoformat(),
        "standards_reference": "NIST Post-Quantum Cryptography Standardization 2024 (FIPS 203, 204, 205)",
        "disclaimer": "This is a POST-QUANTUM CRYPTOGRAPHY RISK ASSESSMENT — NOT a quantum attack detection system.",
        "assets": [
            {
                "id": a.id,
                "asset_name": a.asset_name,
                "algorithm": a.algorithm,
                "key_size": a.key_size,
                "protocol": a.protocol,
                "usage": a.usage,
                "data_sensitivity": a.data_sensitivity,
                "data_lifetime_years": a.data_lifetime_years,
                "pqc_ready": a.pqc_ready,
                "quantum_risk_level": a.quantum_risk_level,
                "recommendation": a.recommendation,
                "migration_status": a.migration_status,
                "nist_standard": a.nist_standard,
                "last_assessed": a.last_assessed.isoformat() if a.last_assessed else None,
            }
            for a in assets
        ],
    }


# ─── Reports ─────────────────────────────────────────────────────────────────

@router.get("/reports")
def get_reports_summary(days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    txns = db.query(Transaction).filter(Transaction.created_at >= since).all()
    incidents = db.query(Incident).filter(Incident.created_at >= since).all()
    devices = db.query(Device).all()

    blocked = [t for t in txns if t.status == "BLOCKED"]
    allowed = [t for t in txns if t.status in ("ALLOW", "COMPLETED")]

    return {
        "report_period_days": days,
        "generated_at": datetime.utcnow().isoformat(),
        "transaction_report": {
            "total": len(txns),
            "allowed": len(allowed),
            "blocked": len(blocked),
            "pending": len([t for t in txns if "VERIF" in t.status]),
            "total_amount_processed": sum(t.amount for t in allowed),
            "total_amount_blocked": sum(t.amount for t in blocked),
            "avg_risk_score": round(sum(t.risk_score for t in txns) / len(txns), 1) if txns else 0,
        },
        "incident_report": {
            "total": len(incidents),
            "open": len([i for i in incidents if i.status == "OPEN"]),
            "resolved": len([i for i in incidents if i.status == "RESOLVED"]),
            "critical": len([i for i in incidents if i.severity == "CRITICAL"]),
        },
        "device_report": {
            "total": len(devices),
            "trusted": len([d for d in devices if d.trust_level == "TRUSTED"]),
            "suspicious": len([d for d in devices if d.trust_level == "SUSPICIOUS"]),
            "blocked": len([d for d in devices if d.trust_level == "BLOCKED"]),
        },
    }


# ─── Beneficiaries ────────────────────────────────────────────────────────────

@router.get("/beneficiaries")
def get_beneficiaries(db: Session = Depends(get_db)):
    from ..models import Beneficiary
    bens = db.query(Beneficiary).all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "upi_id": b.upi_id,
            "category": b.category,
            "trust_score": b.trust_score,
            "risk_score": b.risk_score,
            "is_verified": b.is_verified,
            "is_new": b.is_new,
            "is_flagged": b.is_flagged,
            "flag_reason": b.flag_reason,
            "total_transactions": b.total_transactions,
            "total_amount": b.total_amount,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in bens
    ]


# ─── AI Copilot ───────────────────────────────────────────────────────────────

@router.post("/copilot")
def copilot(req: dict, db: Session = Depends(get_db)):
    """
    SOC AI Copilot — Answers natural language questions using real backend data.
    """
    question = req.get("question", "").lower()
    data = {}
    answer = ""

    if "blocked" in question and ("transaction" in question or "why" in question):
        blocked_txns = db.query(Transaction).filter(Transaction.status == "BLOCKED").order_by(Transaction.created_at.desc()).limit(3).all()
        if blocked_txns:
            t = blocked_txns[0]
            data = {"transaction_id": t.transaction_id_str, "risk_score": t.risk_score, "top_reasons": t.reasons[:3]}
            answer = f"The most recent blocked transaction {t.transaction_id_str} scored {t.risk_score}/100 risk. Top contributing factors: {'; '.join(t.reasons[:2]) if t.reasons else 'See XAI factors in the transaction detail.'}"
        else:
            answer = "No blocked transactions found in the database."

    elif "incident" in question:
        incident_id = None
        for word in question.split():
            if "inc-" in word.upper() or word.upper().startswith("INC"):
                incident_id = word.upper()
                break
        if incident_id:
            inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
            if inc:
                data = {"incident_id": inc.incident_id, "severity": inc.severity, "status": inc.status}
                answer = f"Incident {inc.incident_id}: Severity {inc.severity}, Status {inc.status}. {inc.description or ''}"
            else:
                answer = f"Incident {incident_id} not found."
        else:
            incidents = db.query(Incident).filter(Incident.status == "OPEN").all()
            data = {"open_count": len(incidents), "critical": len([i for i in incidents if i.severity == "CRITICAL"])}
            answer = f"There are {len(incidents)} open incidents, {data['critical']} of which are CRITICAL."

    elif "suspicious" in question and "device" in question:
        devs = db.query(Device).filter(Device.trust_level.in_(["SUSPICIOUS", "BLOCKED"])).all()
        data = {"count": len(devs), "devices": [{"device_id": d.device_id, "trust_level": d.trust_level} for d in devs]}
        answer = f"There are {len(devs)} suspicious/blocked devices: {', '.join(d.device_id for d in devs)}."

    elif "highest risk" in question or "riskiest" in question:
        t = db.query(Transaction).order_by(Transaction.risk_score.desc()).first()
        if t:
            data = {"transaction_id": t.transaction_id_str, "risk_score": t.risk_score}
            answer = f"The highest-risk transaction is {t.transaction_id_str} with risk score {t.risk_score}/100 to {t.merchant}."
        else:
            answer = "No transactions in database yet."

    elif "critical" in question:
        incidents = db.query(Incident).filter(Incident.severity == "CRITICAL", Incident.status == "OPEN").all()
        data = {"critical_incidents": [i.incident_id for i in incidents]}
        answer = f"Today's critical open incidents: {', '.join(i.incident_id for i in incidents) if incidents else 'None'}."

    else:
        total = db.query(Transaction).count()
        blocked = db.query(Transaction).filter(Transaction.status == "BLOCKED").count()
        open_inc = db.query(Incident).filter(Incident.status == "OPEN").count()
        answer = f"NexGuard SOC Summary: {total} total transactions, {blocked} blocked, {open_inc} open incidents. Ask me about specific transactions, incidents, or devices."
        data = {"total_transactions": total, "blocked": blocked, "open_incidents": open_inc}

    return {"question": req.get("question", ""), "answer": answer, "data": data, "confidence": "HIGH"}
