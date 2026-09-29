"""
NexGuard Secure Wallet — NG Bank Router
Simulated NG Bank Integration
POST /api/bank/connect
GET  /api/bank/account
POST /api/bank/verify
"""

import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, NGBankAccount, Wallet
from ..audit import write_audit_log, AuditActions
from ..websocket import manager, WSEvents
from ..security import get_optional_user

router = APIRouter(prefix="/api/bank", tags=["NG Bank (Simulated)"])


def _get_demo_user(db: Session, current_user=None) -> User:
    if current_user:
        return current_user
    user = db.query(User).filter(User.username == "karthik").first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")
    return user


@router.get("/account")
def get_bank_account(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    """
    Fetch the simulated NG Bank account details.
    Display:
    NG Bank
    Account: NG **** XXXX
    Account Holder
    Available Balance: ₹10,00,000
    Status: Active
    """
    user = _get_demo_user(db, current_user)
    bank_acc = db.query(NGBankAccount).filter(NGBankAccount.user_id == user.id).first()

    if not bank_acc:
        # Create simulated NG bank account if not exists
        acc_num = f"NG {random.randint(1000, 9999)} {random.randint(1000, 9999)}"
        bank_acc = NGBankAccount(
            user_id=user.id,
            account_number=acc_num,
            account_holder=user.full_name,
            balance=1000000.0,
            status="ACTIVE",
            is_connected=True,
        )
        db.add(bank_acc)
        db.commit()
        db.refresh(bank_acc)

    # Masked account number e.g. "NG **** 8819"
    parts = bank_acc.account_number.split()
    masked = f"NG **** {parts[-1]}" if len(parts) > 1 else "NG **** 8819"

    return {
        "id": bank_acc.id,
        "bank_name": "NG Bank",
        "tagline": "Simulated Banking Environment — No Real Money Involved",
        "account_number": bank_acc.account_number,
        "account_number_masked": masked,
        "account_holder": bank_acc.account_holder,
        "branch_ifsc": bank_acc.branch_ifsc,
        "available_balance": bank_acc.balance,
        "currency": bank_acc.currency,
        "status": bank_acc.status,
        "is_connected": bank_acc.is_connected,
        "connection_label": "NG Bank Connected" if bank_acc.is_connected else "Not Connected",
        "created_at": bank_acc.created_at.isoformat() if bank_acc.created_at else None,
    }


@router.post("/connect")
async def connect_bank(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    """
    Connect or re-link simulated NG Bank account to NexGuard Wallet.
    """
    user = _get_demo_user(db, current_user)
    bank_acc = db.query(NGBankAccount).filter(NGBankAccount.user_id == user.id).first()

    if not bank_acc:
        acc_num = f"NG {random.randint(1000, 9999)} {random.randint(1000, 9999)}"
        bank_acc = NGBankAccount(
            user_id=user.id,
            account_number=acc_num,
            account_holder=user.full_name,
            balance=1000000.0,
            status="ACTIVE",
            is_connected=True,
        )
        db.add(bank_acc)
    else:
        bank_acc.is_connected = True
        bank_acc.status = "ACTIVE"

    write_audit_log(
        db, action="BANK_CONNECTED",
        actor_id=user.id, actor_name=user.full_name, actor_role=user.role,
        resource_type="BANK_ACCOUNT", resource_id=bank_acc.account_number,
        description=f"Simulated NG Bank account {bank_acc.account_number} connected"
    )
    db.commit()
    db.refresh(bank_acc)

    await manager.broadcast({
        "type": "BANK_CONNECTED",
        "data": {
            "user_id": user.id,
            "account_number": bank_acc.account_number,
            "balance": bank_acc.balance,
            "status": "Connected"
        }
    })

    return {
        "success": True,
        "message": "NG Bank Connected",
        "account_number": bank_acc.account_number,
        "status": bank_acc.status,
        "available_balance": bank_acc.balance,
    }


@router.post("/verify")
def verify_bank(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user)
):
    """
    Verify simulated NG Bank account credentials.
    """
    user = _get_demo_user(db, current_user)
    bank_acc = db.query(NGBankAccount).filter(NGBankAccount.user_id == user.id).first()

    if not bank_acc:
        raise HTTPException(status_code=404, detail="NG Bank account not found")

    return {
        "success": True,
        "verified": True,
        "bank_name": "NG Bank",
        "account_holder": bank_acc.account_holder,
        "status": "Active",
        "message": "NG Bank Account Verified Successfully (Demo Mode)"
    }
