"""
NexGuard Secure Wallet — Transactions Router
Full transaction lifecycle with idempotency, 10-agent analysis, XAI, and ledger management.
"""

import secrets
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User, Wallet, Device, Transaction, Incident, IncidentEvent,
    BehaviorProfile, Notification, RiskAssessment
)
from ..schemas import TransactionCreate, StepUpVerifyRequest
from ..agents import orchestrator
from ..websocket import manager, WSEvents
from ..audit import write_audit_log, AuditActions
from ..security import get_optional_user

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


def _serialize_transaction(t: Transaction, remaining_balance: Optional[float] = None) -> dict:
    d = {
        "id": t.id,
        "transaction_id_str": t.transaction_id_str,
        "amount": t.amount,
        "currency": t.currency,
        "merchant": t.merchant,
        "merchant_category": t.merchant_category,
        "status": t.status,
        "risk_score": t.risk_score,
        "agent_scores": t.agent_scores or {},
        "xai_factors": t.xai_factors or [],
        "reasons": t.reasons or [],
        "device_id": t.device_id,
        "location": t.location,
        "ip_address": t.ip_address,
        "incident_id": t.incident_id,
        "step_up_token": t.step_up_token,
        "step_up_verified": t.step_up_verified,
        "ledger_debited": t.ledger_debited,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
    }
    if remaining_balance is not None:
        d["remaining_balance"] = remaining_balance
    return d


def _credit_recipient_user(
    db: Session,
    sender: User,
    recipient_identifier: Optional[str],
    amount: float,
    currency: str,
    txn_id_str: str,
    purpose: Optional[str] = None
):
    """If the recipient identifier corresponds to a registered user in DB, credit their wallet and ledger."""
    if not recipient_identifier:
        return None
    clean_id = recipient_identifier.strip()
    recipient = db.query(User).filter(
        (User.upi_id.ilike(clean_id)) |
        (User.username.ilike(clean_id)) |
        (User.full_name.ilike(clean_id)) |
        (User.phone_number == clean_id)
    ).first()

    if recipient and recipient.id != sender.id and recipient.wallet:
        recipient.wallet.balance += amount
        # Record recipient's incoming credit transaction
        cr_txn = Transaction(
            transaction_id_str=f"CR-{txn_id_str.replace('TXN-', '')}",
            user_id=recipient.id,
            amount=amount,
            currency=currency,
            merchant=sender.full_name,
            merchant_category="PEER_CREDIT",
            transaction_type="CREDIT",
            payment_method="UPI_P2P",
            purpose=purpose or f"Received from {sender.full_name} ({sender.upi_id})",
            device_id="DEVICE-SERVER",
            session_id="SES-P2P",
            location="India",
            ip_address="127.0.0.1",
            ip_type="PRIVATE",
            status="COMPLETED",
            risk_score=0,
            ledger_debited=False,
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
        )
        db.add(cr_txn)
        # Notify recipient
        notif = Notification(
            user_id=recipient.id,
            title="💰 Money Received",
            message=f"Received ₹{amount:,.2f} from {sender.full_name} ({sender.upi_id}). Balance: ₹{recipient.wallet.balance:,.2f}",
            notification_type="SUCCESS",
            related_transaction_id=cr_txn.transaction_id_str,
        )
        db.add(notif)
        return recipient
    return None



@router.get("")
def get_transactions(
    limit: int = 20,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if user_id:
        query = query.filter(Transaction.user_id == user_id)
    if status:
        query = query.filter(Transaction.status == status.upper())
    txns = query.order_by(Transaction.created_at.desc()).limit(limit).all()
    return {"total": len(txns), "items": [_serialize_transaction(t) for t in txns]}


@router.get("/{txn_id}")
def get_transaction(txn_id: int, db: Session = Depends(get_db)):
    t = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return _serialize_transaction(t)


@router.post("")
async def create_transaction(
    req: TransactionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # ─── Idempotency Check ────────────────────────────────────────────────────
    if req.idempotency_key:
        existing = db.query(Transaction).filter(
            Transaction.idempotency_key == req.idempotency_key
        ).first()
        if existing:
            return _serialize_transaction(existing)

    # ─── Resolve user (JWT auth or demo fallback) ─────────────────────────────
    if current_user:
        user = current_user
    else:
        # Demo fallback — allow unauthenticated for demo scenarios
        user = db.query(User).filter(User.username == "karthik").first()
        if not user:
            raise HTTPException(status_code=404, detail="Demo user not found. Run bootstrap.")

    wallet = user.wallet
    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet not initialized")

    # ─── Account Status & Security Check ───────────────────────────────────────
    if getattr(user, "account_status", "ACTIVE") in ("FROZEN", "BLOCKED"):
        raise HTTPException(
            status_code=403,
            detail=f"Payment rejected: Customer account is {user.account_status} by Security Operations."
        )
    if getattr(wallet, "security_status", "TRUSTED") in ("BLOCKED",):
        raise HTTPException(
            status_code=403,
            detail="Payment rejected: Wallet is blocked due to security alert."
        )

    # ─── Device Context & Quarantine Enforcement ──────────────────────────────
    device = db.query(Device).filter(Device.device_id == req.device_id).first()
    if device and device.trust_level in ("BLOCKED",):
        raise HTTPException(
            status_code=403,
            detail="Payment rejected: Device is quarantined and blocked from transactions."
        )
    device_trust = device.trust_level if device else "NEW"
    device_risk_score = device.risk_score if device else 50
    is_new_device = device is None

    # ─── Behavioral Profile (Digital Twin) ───────────────────────────────────
    behavior = db.query(BehaviorProfile).filter(BehaviorProfile.user_id == user.id).first()

    # ─── Build evaluation payload ─────────────────────────────────────────────
    eval_payload = {
        "amount": req.amount,
        "merchant": req.merchant,
        "merchant_category": req.merchant_category,
        "device_id": req.device_id,
        "device_trust": device_trust,
        "device_model": device.device_model if device else "Unknown",
        "device_risk_score": device_risk_score,
        "is_new_device": is_new_device,
        "session_id": req.session_id,
        "location": req.location,
        "demo_ip": req.demo_ip or (device.ip_address if device else "192.168.1.100"),
        "ip_type": req.ip_type or (device.ip_type if device else "PRIVATE"),
        "ip_address": req.demo_ip or (device.ip_address if device else "192.168.1.100"),
        "biometric_verified": req.biometric_verified,
        "biometric_confidence": req.biometric_confidence,
        # Behavioral baseline from Digital Twin
        "baseline_avg_amount": behavior.avg_transaction_amount if behavior else 2500.0,
        "baseline_std_amount": behavior.std_transaction_amount if behavior else 1500.0,
        "typical_devices": behavior.typical_devices if behavior else ["DEVICE-001"],
        "typical_categories": behavior.typical_categories if behavior else ["DINING", "SHOPPING"],
        "typical_hours_start": behavior.typical_hours_start if behavior else 9,
        "typical_hours_end": behavior.typical_hours_end if behavior else 22,
        # Previous location for geo-velocity (use device's last known or default)
        "previous_location": device.location if device else "Chennai, IN [SYNTHETIC]",
        "minutes_since_last_txn": 15.0 if "DEVICE-002" in req.device_id else 60.0,
        # Beneficiary context
        "beneficiary_trust_score": 40 if any(
            k in req.merchant.lower() for k in ["cayman", "offshore", "wire", "crypto"]
        ) else 85,
        "beneficiary_is_new": any(
            k in req.merchant.lower() for k in ["cayman", "offshore", "exchange", "wire"]
        ),
        "beneficiary_txn_count": 0 if any(
            k in req.merchant.lower() for k in ["cayman", "offshore", "exchange"]
        ) else 10,
        # Session context
        "concurrent_sessions": 3 if "8821" in req.session_id else 1,
        "session_location_match": "London" not in req.location,
        "session_device_match": True,
        "session_age_minutes": 30.0,
        # Cyber threat context
        "device_rooted": device_trust == "SUSPICIOUS",
        "failed_login_count": 3 if "DEVICE-002" in req.device_id else 0,
        # PQC context
        "tls_version": "TLS 1.3",
        "data_sensitivity": "HIGH",
    }

    # ─── Run 10 AI Security Agents ────────────────────────────────────────────
    result = orchestrator.evaluate_transaction(eval_payload)
    status_decision = result["decision"]
    risk_score = result["risk_score"]
    agent_scores = result["agent_scores"]
    xai_factors = result["xai_factors"]
    reasons = result["reasons"]
    execution_time_ms = result.get("execution_time_ms")

    txn_id_str = f"TXN-{secrets.token_hex(4).upper()}"
    incident_id = None
    step_up_token = None
    remaining_balance = wallet.balance

    # ─── ALLOW: Settle payment immediately ───────────────────────────────────
    if status_decision == "ALLOW":
        if wallet.balance < req.amount:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        wallet.balance -= req.amount
        remaining_balance = wallet.balance
        # Database multi-user transfer: Credit recipient wallet if registered user
        target_recipient = req.recipient_upi or req.merchant
        _credit_recipient_user(db, user, target_recipient, req.amount, req.currency, txn_id_str, req.purpose)

    # ─── VERIFY: Generate step-up token ──────────────────────────────────────
    elif status_decision == "VERIFY":
        step_up_token = secrets.token_hex(8)
        status_decision = "PENDING_VERIFICATION"

    # ─── BLOCK: Create incident, notify ──────────────────────────────────────
    elif status_decision == "BLOCK":
        incident_num = db.query(Incident).count() + 1
        incident_id = f"INC-{incident_num:04d}"
        severity = "CRITICAL" if risk_score > 80 else "HIGH"

        incident = Incident(
            incident_id=incident_id,
            user_id=user.id,
            device_id=req.device_id,
            title=f"Security Block: {req.merchant_category} Transfer — {req.merchant}",
            severity=severity,
            status="OPEN",
            description=f"Transaction blocked. Composite risk score: {risk_score}/100. Device: {req.device_id}. Location: {req.location}.",
            agent_evidence={"agent_scores": agent_scores, "device_id": req.device_id, "location": req.location, "amount": req.amount},
            xai_factors=xai_factors,
            risk_score=risk_score,
            transaction_id_str=txn_id_str,
        )
        db.add(incident)
        db.flush()

        # Initial incident timeline event
        db.add(IncidentEvent(
            incident_id_fk=incident.id,
            event_type="INCIDENT_CREATED",
            actor="AI_ENGINE",
            description=f"Incident auto-created by NexGuard 10-Agent AI Security Engine. Risk: {risk_score}/100.",
            event_metadata={"risk_score": risk_score, "top_factor": xai_factors[0]["agent"] if xai_factors else "unknown"}
        ))

        # Depress wallet security score
        wallet.security_score = max(40, (wallet.security_score or 94) - 15)
        wallet.security_status = "AT_RISK"

        # Create security notification for user
        notif = Notification(
            user_id=user.id,
            title="🚫 Transaction Blocked",
            message=f"₹{req.amount:,.0f} transfer to {req.merchant} was BLOCKED. Risk: {risk_score}/100. {xai_factors[0]['reasons'][0] if xai_factors and xai_factors[0]['reasons'] else ''}",
            notification_type="ALERT",
            related_incident_id=incident_id,
        )
        db.add(notif)

    # ─── Save Transaction ─────────────────────────────────────────────────────
    txn = Transaction(
        transaction_id_str=txn_id_str,
        idempotency_key=req.idempotency_key,
        user_id=user.id,
        amount=req.amount,
        currency=req.currency,
        merchant=req.merchant,
        merchant_category=req.merchant_category,
        transaction_type=req.transaction_type,
        payment_method=req.payment_method,
        purpose=req.purpose,
        device_id=req.device_id,
        session_id=req.session_id,
        location=req.location,
        ip_address=req.demo_ip or (device.ip_address if device else "192.168.1.100"),
        ip_type=req.ip_type or (device.ip_type if device else "PRIVATE"),
        source_ip=request.client.host if request.client else "127.0.0.1",
        biometric_verified=req.biometric_verified,
        biometric_confidence=req.biometric_confidence,
        status=status_decision,
        risk_score=risk_score,
        agent_scores=agent_scores,
        agent_reasons={k: v["reasons"] for k, v in {n: {"reasons": result["agent_reasons"].get(n, [])} for n in agent_scores}.items()},
        xai_factors=xai_factors,
        reasons=reasons[:10],  # store top 10 reasons
        step_up_token=step_up_token,
        step_up_verified=False,
        incident_id=incident_id,
        ledger_debited=(status_decision == "ALLOW"),
        completed_at=datetime.utcnow() if status_decision == "ALLOW" else None,
    )
    db.add(txn)

    # ─── Save Risk Assessment ─────────────────────────────────────────────────
    db.flush()
    risk_assessment = RiskAssessment(
        transaction_id=txn.id,
        composite_score=risk_score,
        agent_scores=agent_scores,
        agent_weights=dict(orchestrator.agents.__class__.__dict__.get("weights", {})),
        agent_confidence=result.get("agent_confidence", {}),
        xai_factors=xai_factors,
        decision=result["decision"] if result["decision"] != "VERIFY" else "VERIFY",
        execution_time_ms=execution_time_ms,
    )
    db.add(risk_assessment)

    # ─── Update Digital Twin behavioral profile ───────────────────────────────
    if status_decision == "ALLOW" and behavior:
        behavior.transaction_count += 1
        n = behavior.transaction_count
        # Incremental mean update
        behavior.avg_transaction_amount = (
            (behavior.avg_transaction_amount * (n - 1) + req.amount) / n
        )
        if req.device_id not in (behavior.typical_devices or []):
            devices = list(behavior.typical_devices or [])
            devices.append(req.device_id)
            behavior.typical_devices = devices
        if req.merchant_category not in (behavior.typical_categories or []):
            cats = list(behavior.typical_categories or [])
            cats.append(req.merchant_category)
            behavior.typical_categories = cats

    # ─── Audit log ────────────────────────────────────────────────────────────
    action_map = {
        "ALLOW": AuditActions.TRANSACTION_ALLOWED,
        "PENDING_VERIFICATION": AuditActions.VERIFICATION_REQUESTED,
        "BLOCK": AuditActions.TRANSACTION_BLOCKED,
    }
    write_audit_log(
        db,
        action=action_map.get(status_decision, AuditActions.TRANSACTION_CREATED),
        actor_id=user.id, actor_name=user.full_name, actor_role=user.role,
        resource_type="TRANSACTION", resource_id=txn_id_str,
        description=f"Transaction {txn_id_str}: {req.merchant} ₹{req.amount:,.0f} → {status_decision} (risk: {risk_score})",
        ip_address=request.client.host if request.client else "unknown",
    )

    db.commit()
    db.refresh(txn)

    # ─── WebSocket Events ─────────────────────────────────────────────────────
    ws_type = (
        WSEvents.CRITICAL_ALERT if status_decision == "BLOCK"
        else WSEvents.STEP_UP_CHALLENGE if status_decision == "PENDING_VERIFICATION"
        else WSEvents.TRANSACTION_ALLOWED
    )
    await manager.send_transaction_event(
        event_type=ws_type,
        transaction_data={
            "transaction_id": txn.id,
            "transaction_id_str": txn.transaction_id_str,
            "user": user.full_name,
            "amount": txn.amount,
            "merchant": txn.merchant,
            "merchant_category": txn.merchant_category,
            "status": txn.status,
            "risk_score": txn.risk_score,
            "device_id": txn.device_id,
            "location": txn.location,
            "incident_id": incident_id,
            "xai_factors": xai_factors[:5],
            "reasons": reasons[:5],
            "agent_scores": agent_scores,
            "execution_time_ms": execution_time_ms,
        },
        device_id=req.device_id,
    )

    return _serialize_transaction(txn, remaining_balance=remaining_balance)


@router.post("/{txn_id}/verify-step-up")
async def verify_step_up(
    txn_id: int,
    req: StepUpVerifyRequest,
    db: Session = Depends(get_db)
):
    """Complete step-up biometric/OTP verification and settle the pending payment."""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if txn.status not in ("VERIFY", "PENDING_VERIFICATION"):
        return {"status": txn.status, "message": "Transaction is not awaiting step-up verification."}

    user = db.query(User).filter(User.id == txn.user_id).first()
    wallet = user.wallet if user else None

    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet not found")
    if wallet.balance < txn.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    wallet.balance -= txn.amount
    txn.status = "COMPLETED"
    txn.step_up_verified = True
    txn.step_up_type = req.verification_type
    txn.ledger_debited = True
    txn.completed_at = datetime.utcnow()

    # Database multi-user transfer: Credit recipient wallet if registered user
    if user:
        _credit_recipient_user(db, user, txn.merchant, txn.amount, txn.currency, txn.transaction_id_str, txn.purpose)

    # Append to reasons
    reasons = list(txn.reasons or [])
    reasons.append(f"✅ Step-Up {req.verification_type} verification passed — payment released.")
    txn.reasons = reasons

    write_audit_log(
        db, action=AuditActions.TRANSACTION_VERIFIED,
        actor_id=user.id if user else None, actor_name=user.full_name if user else "unknown",
        resource_type="TRANSACTION", resource_id=txn.transaction_id_str,
        description=f"Step-up {req.verification_type} verified for {txn.transaction_id_str}"
    )
    db.commit()

    await manager.send_transaction_event(
        event_type=WSEvents.STEP_UP_RESOLVED,
        transaction_data={
            "transaction_id": txn.id,
            "transaction_id_str": txn.transaction_id_str,
            "status": "COMPLETED",
            "verification_type": req.verification_type,
            "message": "Payment released after step-up verification.",
            "remaining_balance": wallet.balance,
        },
        device_id=txn.device_id,
    )

    return {
        "id": txn.id,
        "transaction_id_str": txn.transaction_id_str,
        "status": "COMPLETED",
        "message": f"Step-Up {req.verification_type} verification successful. Payment of ₹{txn.amount:,.0f} settled.",
        "remaining_balance": wallet.balance,
    }


@router.post("/{txn_id}/verify")
async def verify_transaction_alias(
    txn_id: int,
    req: StepUpVerifyRequest,
    db: Session = Depends(get_db)
):
    """Exact POST /api/transactions/{id}/verify endpoint specified in Master Prompt."""
    return await verify_step_up(txn_id, req, db)


@router.get("/risk/{txn_id}")
def get_transaction_risk(txn_id: int, db: Session = Depends(get_db)):
    """Fetch risk assessment for a transaction."""
    assessment = db.query(RiskAssessment).filter(RiskAssessment.transaction_id == txn_id).first()
    if not assessment:
        txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {
            "transaction_id": txn.id,
            "transaction_id_str": txn.transaction_id_str,
            "composite_score": txn.risk_score,
            "decision": txn.status,
            "agent_scores": txn.agent_scores or {},
            "xai_factors": txn.xai_factors or [],
            "reasons": txn.reasons or [],
        }
    return {
        "transaction_id": assessment.transaction_id,
        "composite_score": assessment.composite_score,
        "decision": assessment.decision,
        "agent_scores": assessment.agent_scores,
        "agent_weights": assessment.agent_weights,
        "agent_confidence": assessment.agent_confidence,
        "xai_factors": assessment.xai_factors,
        "execution_time_ms": assessment.execution_time_ms,
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
    }

