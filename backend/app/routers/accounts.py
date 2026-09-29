"""
NexGuard Secure Wallet — Accounts Router
Control Center Bank Management Operations
GET  /api/accounts
POST /api/accounts/{id}/freeze
POST /api/accounts/{id}/unfreeze
POST /api/accounts/{id}/restrict
POST /api/accounts/{id}/block
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Wallet, NGBankAccount, Device, Transaction, SecurityEvent
from ..audit import write_audit_log, AuditActions
from ..websocket import manager, WSEvents
from ..security import get_optional_user

router = APIRouter(prefix="/api/accounts", tags=["Accounts Control"])


class AccountActionRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Mandatory reason for SOC/Admin action")
    actor_role: Optional[str] = "ADMIN"
    actor_name: Optional[str] = "SOC Operations Lead"


def _serialize_account(user: User) -> dict:
    wallet = user.wallet
    bank = user.ng_bank_account
    recent_txn_count = len(user.transactions) if user.transactions else 0
    device_count = len(user.devices) if user.devices else 0

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "upi_id": user.upi_id,
        "account_status": user.account_status or "ACTIVE",
        "wallet_id": wallet.id if wallet else None,
        "balance": wallet.balance if wallet else 0.0,
        "security_score": wallet.security_score if wallet else 94,
        "security_status": wallet.security_status if wallet else "TRUSTED",
        "bank_account_number": bank.account_number if bank else f"NG 4092 {user.id:04d}",
        "bank_balance": bank.balance if bank else 1000000.0,
        "bank_connected": bank.is_connected if bank else True,
        "device_count": device_count,
        "transaction_count": recent_txn_count,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.get("")
def get_accounts(db: Session = Depends(get_db)):
    """List all accounts with their security and financial statuses."""
    users = db.query(User).filter(User.role == "CUSTOMER").all()
    return [_serialize_account(u) for u in users]


@router.get("/{user_id}")
def get_account(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    return _serialize_account(user)


@router.post("/{user_id}/freeze")
async def freeze_account(
    user_id: int,
    req: AccountActionRequest,
    db: Session = Depends(get_db)
):
    """Freeze account — suspends all outgoing payments and wallet transfers."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    user.account_status = "FROZEN"
    if user.wallet:
        user.wallet.security_status = "FROZEN"
        user.wallet.security_score = min(user.wallet.security_score, 30)

    # Log security event
    db.add(SecurityEvent(
        user_id=user.id,
        event_type="ACCOUNT_FROZEN",
        severity="HIGH",
        description=f"Account frozen by {req.actor_name}: {req.reason}",
        event_metadata={"reason": req.reason, "actor_role": req.actor_role}
    ))

    # Mandatory audit log
    write_audit_log(
        db, action="ACCOUNT_FROZEN",
        actor_name=req.actor_name, actor_role=req.actor_role,
        resource_type="ACCOUNT", resource_id=str(user.id),
        description=f"Account {user.username} FROZEN. Reason: {req.reason}"
    )
    db.commit()

    await manager.broadcast({
        "type": "ACCOUNT_FROZEN",
        "data": {
            "user_id": user.id,
            "username": user.username,
            "status": "FROZEN",
            "reason": req.reason,
            "timestamp": datetime.utcnow().isoformat()
        }
    })

    return {
        "success": True,
        "message": f"Account {user.username} frozen successfully.",
        "account": _serialize_account(user)
    }


@router.post("/{user_id}/unfreeze")
async def unfreeze_account(
    user_id: int,
    req: AccountActionRequest,
    db: Session = Depends(get_db)
):
    """Unfreeze account — restores active operation."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    user.account_status = "ACTIVE"
    if user.wallet:
        user.wallet.security_status = "TRUSTED"
        user.wallet.security_score = 90

    write_audit_log(
        db, action="ACCOUNT_UNFROZEN",
        actor_name=req.actor_name, actor_role=req.actor_role,
        resource_type="ACCOUNT", resource_id=str(user.id),
        description=f"Account {user.username} UNFROZEN. Reason: {req.reason}"
    )
    db.commit()

    await manager.broadcast({
        "type": "ACCOUNT_UNFROZEN",
        "data": {
            "user_id": user.id,
            "username": user.username,
            "status": "ACTIVE",
            "reason": req.reason,
            "timestamp": datetime.utcnow().isoformat()
        }
    })

    return {
        "success": True,
        "message": f"Account {user.username} restored to ACTIVE status.",
        "account": _serialize_account(user)
    }


@router.post("/{user_id}/restrict")
async def restrict_account(
    user_id: int,
    req: AccountActionRequest,
    db: Session = Depends(get_db)
):
    """Restrict account — enforces verification on every transaction."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    user.account_status = "RESTRICTED"
    if user.wallet:
        user.wallet.security_status = "GUARDED"

    write_audit_log(
        db, action="ACCOUNT_RESTRICTED",
        actor_name=req.actor_name, actor_role=req.actor_role,
        resource_type="ACCOUNT", resource_id=str(user.id),
        description=f"Account {user.username} RESTRICTED. Reason: {req.reason}"
    )
    db.commit()

    await manager.broadcast({
        "type": "ACCOUNT_RESTRICTED",
        "data": {
            "user_id": user.id,
            "username": user.username,
            "status": "RESTRICTED",
            "reason": req.reason,
            "timestamp": datetime.utcnow().isoformat()
        }
    })

    return {
        "success": True,
        "message": f"Account {user.username} status set to RESTRICTED.",
        "account": _serialize_account(user)
    }


@router.post("/{user_id}/block")
async def block_account(
    user_id: int,
    req: AccountActionRequest,
    db: Session = Depends(get_db)
):
    """Block account completely."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    user.account_status = "BLOCKED"
    if user.wallet:
        user.wallet.security_status = "BLOCKED"
        user.wallet.security_score = 0

    write_audit_log(
        db, action="ACCOUNT_BLOCKED",
        actor_name=req.actor_name, actor_role=req.actor_role,
        resource_type="ACCOUNT", resource_id=str(user.id),
        description=f"Account {user.username} BLOCKED. Reason: {req.reason}"
    )
    db.commit()

    await manager.broadcast({
        "type": "ACCOUNT_BLOCKED",
        "data": {
            "user_id": user.id,
            "username": user.username,
            "status": "BLOCKED",
            "reason": req.reason,
            "timestamp": datetime.utcnow().isoformat()
        }
    })

    return {
        "success": True,
        "message": f"Account {user.username} has been BLOCKED.",
        "account": _serialize_account(user)
    }
