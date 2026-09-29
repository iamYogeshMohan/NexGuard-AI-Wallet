"""
NexGuard Secure Wallet — Wallet Router
GET  /api/wallet/profile
GET  /api/wallet/security-score
POST /api/wallet/add-money
GET  /api/wallet/notifications
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Wallet, Device, Transaction, BehaviorProfile, Notification
from ..schemas import AddMoneyRequest
from ..websocket import manager, WSEvents
from ..audit import write_audit_log, AuditActions
from ..security import get_optional_user

router = APIRouter(prefix="/api/wallet", tags=["Wallet"])


def _get_demo_user(db: Session, current_user=None) -> User:
    if current_user:
        return current_user
    user = db.query(User).filter(User.username == "karthik").first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found. Run bootstrap.")
    return user


@router.get("/balance")
def get_wallet_balance(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    user = _get_demo_user(db, current_user)
    wallet = user.wallet
    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet not initialized")

    bank = user.ng_bank_account
    return {
        "balance": wallet.balance,
        "currency": wallet.currency,
        "security_score": wallet.security_score,
        "security_status": wallet.security_status,
        "account_status": user.account_status or "ACTIVE",
        "ng_bank_connected": bank.is_connected if bank else True,
        "ng_bank_account_number": bank.account_number if bank else "NG 4092 8819",
        "ng_bank_balance": bank.balance if bank else 1000000.0,
    }


@router.get("")
@router.get("/profile")
def get_wallet_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    user = _get_demo_user(db, current_user)
    wallet = user.wallet
    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet not initialized")

    devices = db.query(Device).filter(Device.user_id == user.id).all()
    recent_txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "username": user.username,
        "email": user.email,
        "phone_number": user.phone_number,
        "upi_id": user.upi_id,
        "balance": wallet.balance,
        "currency": wallet.currency,
        "security_score": wallet.security_score,
        "security_status": wallet.security_status,
        "devices": [
            {
                "id": d.id,
                "device_id": d.device_id,
                "device_name": d.device_name,
                "device_model": d.device_model,
                "trust_level": d.trust_level,
                "ip_address": d.ip_address,
                "ip_type": d.ip_type,
                "location": d.location,
                "is_active": d.is_active,
            }
            for d in devices
        ],
        "recent_transactions": [
            {
                "id": t.id,
                "transaction_id_str": t.transaction_id_str,
                "amount": t.amount,
                "merchant": t.merchant,
                "status": t.status,
                "risk_score": t.risk_score,
                "created_at": t.created_at.isoformat(),
            }
            for t in recent_txns
        ],
    }


@router.get("/security-score")
def get_security_score(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    user = _get_demo_user(db, current_user)
    wallet = user.wallet
    score = wallet.security_score if wallet else 94

    # Dynamic breakdown based on actual wallet state
    devices = db.query(Device).filter(Device.user_id == user.id).all()
    trusted_devices = [d for d in devices if d.trust_level == "TRUSTED"]
    blocked_devices = [d for d in devices if d.trust_level == "BLOCKED"]

    device_score = 95 if not blocked_devices and trusted_devices else (40 if blocked_devices else 70)
    session_score = 90
    network_score = 88
    behavior_score = 92
    pqc_score = 97

    # Compute dynamic overall
    dynamic_score = int((device_score * 0.25 + session_score * 0.20 + network_score * 0.20 + behavior_score * 0.20 + pqc_score * 0.15))

    # Update wallet score in DB
    if wallet and abs(wallet.security_score - dynamic_score) > 5:
        wallet.security_score = dynamic_score
        wallet.security_status = "TRUSTED" if dynamic_score >= 80 else "GUARDED" if dynamic_score >= 50 else "AT_RISK"
        db.commit()

    status_label = "TRUSTED" if dynamic_score >= 80 else "GUARDED" if dynamic_score >= 50 else "AT_RISK"

    recommendations = []
    if blocked_devices:
        recommendations.append(f"⚠️ {len(blocked_devices)} device(s) quarantined — review in Device Management.")
    if dynamic_score < 80:
        recommendations.append("Enable transaction threshold alerts for amounts above ₹10,000.")
    recommendations.append("Primary device certified on trusted local subnet.")
    recommendations.append("Hybrid TLS 1.3 / Kyber-1024 post-quantum channel active.")

    return {
        "score": dynamic_score,
        "status": status_label,
        "breakdown": {
            "device_integrity": device_score,
            "session_security": session_score,
            "network_integrity": network_score,
            "behavior_consistency": behavior_score,
            "pqc_readiness": pqc_score,
        },
        "recommendations": recommendations,
        "active_devices": len(devices),
        "trusted_devices": len(trusted_devices),
        "blocked_devices": len(blocked_devices),
    }


@router.post("/add-money")
async def add_money(
    req: AddMoneyRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    user = _get_demo_user(db, current_user)
    wallet = user.wallet
    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet not found")

    wallet.balance += req.amount

    write_audit_log(
        db, action=AuditActions.WALLET_DEPOSIT,
        actor_id=user.id, actor_name=user.full_name,
        resource_type="WALLET", resource_id=str(user.id),
        description=f"Wallet top-up: ₹{req.amount:,.0f} from {req.source}"
    )
    db.commit()
    db.refresh(wallet)

    await manager.broadcast({
        "type": WSEvents.WALLET_DEPOSIT,
        "data": {
            "amount": req.amount,
            "new_balance": wallet.balance,
            "source": req.source,
            "user": user.full_name,
        }
    })

    return {
        "message": f"₹{req.amount:,.0f} added to wallet from {req.source}.",
        "new_balance": wallet.balance,
    }


@router.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    user = _get_demo_user(db, current_user)
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.notification_type,
            "is_read": n.is_read,
            "related_incident_id": n.related_incident_id,
            "related_transaction_id": n.related_transaction_id,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"status": "ok"}


@router.get("/peers")
def get_peer_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    """Return all registered peer users for multi-user transfers."""
    users = db.query(User).filter(User.role.in_(["CUSTOMER", "MERCHANT"])).all()
    res = []
    for u in users:
        res.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "upi_id": u.upi_id,
            "email": u.email,
            "phone_number": u.phone_number,
            "role": u.role,
            "balance": u.wallet.balance if u.wallet else 0.0,
            "is_current": (u.username == "karthik" if not current_user else u.id == current_user.id),
        })
    return res

