"""
NexGuard Secure Wallet — Beneficiaries Router
GET    /api/beneficiaries
POST   /api/beneficiaries
DELETE /api/beneficiaries/{id}
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Beneficiary
from ..audit import write_audit_log, AuditActions
from ..websocket import manager
from ..security import get_optional_user

router = APIRouter(prefix="/api/beneficiaries", tags=["Beneficiaries"])


class BeneficiaryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    mobile: Optional[str] = "+91 98765 00000"
    upi_id: str = Field(..., min_length=3, max_length=100)
    relationship: Optional[str] = "FRIEND"
    category: Optional[str] = "RETAIL"
    account_number: Optional[str] = None
    bank_name: Optional[str] = "NG Bank"


def _get_demo_user(db: Session, current_user=None) -> User:
    if current_user:
        return current_user
    user = db.query(User).filter(User.username == "karthik").first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")
    return user


def _serialize_beneficiary(b: Beneficiary) -> dict:
    return {
        "id": b.id,
        "name": b.name,
        "upi_id": b.upi_id,
        "mobile": b.mobile,
        "relationship": b.relationship_type or "FRIEND",
        "category": b.category,
        "account_number": b.account_number,
        "bank_name": b.bank_name,
        "trust_score": b.trust_score,
        "risk_score": b.risk_score,
        "status": b.status or "ACTIVE",
        "risk_status": b.risk_status or "LOW",
        "is_verified": b.is_verified,
        "is_new": b.is_new,
        "total_transactions": b.total_transactions,
        "total_amount": b.total_amount,
        "is_flagged": b.is_flagged,
        "flag_reason": b.flag_reason,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "last_transaction_at": b.last_transaction_at.isoformat() if b.last_transaction_at else None,
    }


@router.get("")
def get_beneficiaries(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    """List all beneficiaries for the user."""
    user = _get_demo_user(db, current_user)
    bens = db.query(Beneficiary).filter(Beneficiary.user_id == user.id).all()
    return [_serialize_beneficiary(b) for b in bens]


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_beneficiary(
    req: BeneficiaryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    """Add a new simulated beneficiary."""
    user = _get_demo_user(db, current_user)

    # Check if duplicate UPI
    existing = db.query(Beneficiary).filter(
        Beneficiary.user_id == user.id,
        Beneficiary.upi_id == req.upi_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Beneficiary with this UPI ID already exists")

    # Assess risk for new beneficiary
    is_suspicious = any(w in req.name.lower() or w in req.upi_id.lower() for w in ["cayman", "offshore", "crypto", "wire", "hacker"])
    trust = 20 if is_suspicious else 85
    risk = 80 if is_suspicious else 15
    risk_status = "HIGH" if is_suspicious else "LOW"
    status_label = "RESTRICTED" if is_suspicious else "ACTIVE"

    b = Beneficiary(
        user_id=user.id,
        name=req.name,
        upi_id=req.upi_id,
        mobile=req.mobile,
        relationship_type=req.relationship,
        category=req.category,
        account_number=req.account_number,
        bank_name=req.bank_name,
        trust_score=trust,
        risk_score=risk,
        status=status_label,
        risk_status=risk_status,
        is_verified=not is_suspicious,
        is_new=True,
        total_transactions=0,
        total_amount=0.0,
        is_flagged=is_suspicious,
        flag_reason="High risk recipient keyword match" if is_suspicious else None,
    )
    db.add(b)

    write_audit_log(
        db, action="BENEFICIARY_ADDED",
        actor_id=user.id, actor_name=user.full_name, actor_role=user.role,
        resource_type="BENEFICIARY", resource_id=req.upi_id,
        description=f"Beneficiary {req.name} ({req.upi_id}) added with status {status_label}"
    )
    db.commit()
    db.refresh(b)

    await manager.broadcast({
        "type": "BENEFICIARY_ADDED",
        "data": _serialize_beneficiary(b)
    })

    return _serialize_beneficiary(b)


@router.delete("/{beneficiary_id}")
async def delete_beneficiary(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    """Delete a beneficiary."""
    user = _get_demo_user(db, current_user)
    b = db.query(Beneficiary).filter(
        Beneficiary.id == beneficiary_id,
        Beneficiary.user_id == user.id
    ).first()
    if not b:
        raise HTTPException(status_code=404, detail="Beneficiary not found")

    name = b.name
    upi = b.upi_id
    db.delete(b)

    write_audit_log(
        db, action="BENEFICIARY_REMOVED",
        actor_id=user.id, actor_name=user.full_name, actor_role=user.role,
        resource_type="BENEFICIARY", resource_id=str(beneficiary_id),
        description=f"Beneficiary {name} ({upi}) removed"
    )
    db.commit()

    await manager.broadcast({
        "type": "BENEFICIARY_REMOVED",
        "data": {"id": beneficiary_id, "name": name, "upi_id": upi}
    })

    return {"success": True, "message": f"Beneficiary {name} removed successfully."}
