"""
NexGuard Secure Wallet — Customers Router
GET /api/customers
GET /api/customers/{id}
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Wallet, Device, Transaction, Incident, SecurityEvent
from ..security import get_optional_user

router = APIRouter(prefix="/api/customers", tags=["Customers"])


def _serialize_customer_full(u: User, db: Session) -> dict:
    wallet = u.wallet
    devices = db.query(Device).filter(Device.user_id == u.id).all()
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == u.id)
        .order_by(Transaction.created_at.desc())
        .limit(10)
        .all()
    )
    incidents = (
        db.query(Incident)
        .filter(Incident.user_id == u.id)
        .order_by(Incident.created_at.desc())
        .limit(5)
        .all()
    )
    security_events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.user_id == u.id)
        .order_by(SecurityEvent.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name,
        "email": u.email,
        "phone_number": u.phone_number,
        "upi_id": u.upi_id,
        "role": u.role,
        "account_status": u.account_status or "ACTIVE",
        "wallet_balance": wallet.balance if wallet else 0.0,
        "security_score": wallet.security_score if wallet else 94,
        "security_status": wallet.security_status if wallet else "TRUSTED",
        "devices": [
            {
                "id": d.id,
                "device_id": d.device_id,
                "device_name": d.device_name,
                "trust_level": d.trust_level,
                "risk_score": d.risk_score,
                "ip_address": d.ip_address,
                "location": d.location,
                "last_seen": d.last_seen.isoformat() if d.last_seen else None,
            }
            for d in devices
        ],
        "transactions": [
            {
                "id": t.id,
                "transaction_id_str": t.transaction_id_str,
                "amount": t.amount,
                "merchant": t.merchant,
                "status": t.status,
                "risk_score": t.risk_score,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in transactions
        ],
        "incidents": [
            {
                "id": inc.id,
                "incident_id": inc.incident_id,
                "title": inc.title,
                "severity": inc.severity,
                "status": inc.status,
                "created_at": inc.created_at.isoformat() if inc.created_at else None,
            }
            for inc in incidents
        ],
        "security_events": [
            {
                "id": se.id,
                "event_type": se.event_type,
                "severity": se.severity,
                "description": se.description,
                "created_at": se.created_at.isoformat() if se.created_at else None,
            }
            for se in security_events
        ],
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.get("")
def get_customers(db: Session = Depends(get_db)):
    """List all registered customers."""
    customers = db.query(User).filter(User.role == "CUSTOMER").all()
    return [_serialize_customer_full(c, db) for c in customers]


@router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get single customer complete profile."""
    customer = db.query(User).filter(User.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _serialize_customer_full(customer, db)
