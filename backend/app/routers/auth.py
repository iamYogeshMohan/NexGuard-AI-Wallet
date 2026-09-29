"""
NexGuard Secure Wallet — Auth Router
POST /api/auth/login
POST /api/auth/register
POST /api/auth/otp
POST /api/auth/verify
POST /api/auth/forgot-password
GET  /api/auth/me
"""

import hashlib
import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import User, Wallet, BehaviorProfile, NGBankAccount, OTPToken
from ..schemas import TokenResponse
from ..security import hash_password, verify_password, create_access_token, get_current_user
from ..audit import write_audit_log, AuditActions
from ..websocket import manager, WSEvents
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str  # Can be username or email
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    confirm_password: Optional[str] = None
    phone_number: Optional[str] = "+91 98765 43210"

class OTPRequest(BaseModel):
    identifier: str  # Email or Mobile
    purpose: Optional[str] = "LOGIN"  # LOGIN, REGISTRATION, STEP_UP, FORGOT_PASSWORD

class OTPVerifyRequest(BaseModel):
    identifier: str
    otp_code: str
    purpose: Optional[str] = "LOGIN"

class ForgotPasswordRequest(BaseModel):
    identifier: str
    otp_code: str
    new_password: str


def _hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


@router.post("/otp")
async def generate_otp(req: OTPRequest, db: Session = Depends(get_db)):
    """
    Generate a 6-digit OTP for phone/email.
    Features:
    - 6-digit code
    - Hash stored in DB (not plaintext)
    - 5-minute expiry
    - Resend cooldown (30 seconds)
    - Clearly labeled demo OTP returned for evaluation.
    """
    now = datetime.utcnow()

    # Check for active cooldown
    active_token = db.query(OTPToken).filter(
        OTPToken.identifier == req.identifier,
        OTPToken.purpose == req.purpose,
        OTPToken.is_verified == False
    ).order_by(OTPToken.created_at.desc()).first()

    if active_token and active_token.cooldown_until and active_token.cooldown_until > now:
        remaining = int((active_token.cooldown_until - now).total_seconds())
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {remaining} seconds before requesting a new OTP."
        )

    # Generate 6-digit OTP
    code = f"{random.randint(100000, 999999)}"
    code_hash = _hash_otp(code)
    expires = now + timedelta(minutes=5)
    cooldown = now + timedelta(seconds=30)

    token = OTPToken(
        identifier=req.identifier,
        otp_hash=code_hash,
        purpose=req.purpose,
        attempts=0,
        max_attempts=3,
        is_verified=False,
        expires_at=expires,
        cooldown_until=cooldown,
    )
    db.add(token)
    db.commit()

    return {
        "success": True,
        "message": f"6-digit OTP generated for {req.identifier}",
        "demo_otp": code,  # Displayed in demo mode as required
        "expires_in_seconds": 300,
        "cooldown_seconds": 30,
        "mode": "DEMO BANKING ENVIRONMENT"
    }


@router.post("/verify")
async def verify_otp(req: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Verify 6-digit OTP with attempt limits, expiration, and rate limiting.
    """
    now = datetime.utcnow()
    token = db.query(OTPToken).filter(
        OTPToken.identifier == req.identifier,
        OTPToken.purpose == req.purpose,
        OTPToken.is_verified == False
    ).order_by(OTPToken.created_at.desc()).first()

    if not token:
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new OTP.")

    if token.expires_at < now:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new OTP.")

    if token.attempts >= token.max_attempts:
        raise HTTPException(status_code=403, detail="Maximum OTP verification attempts exceeded.")

    provided_hash = _hash_otp(req.otp_code)
    if token.otp_hash != provided_hash:
        token.attempts += 1
        db.commit()
        remaining = token.max_attempts - token.attempts
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP code. {remaining} attempt(s) remaining."
        )

    # Valid OTP
    token.is_verified = True
    db.commit()

    # If login purpose, issue JWT
    user = db.query(User).filter(
        or_(User.email == req.identifier, User.phone_number == req.identifier, User.username == req.identifier)
    ).first()

    auth_token = None
    if user:
        auth_token = create_access_token({"sub": user.username, "role": user.role})

    return {
        "success": True,
        "message": "OTP verified successfully",
        "verified": True,
        "access_token": auth_token,
        "token_type": "bearer" if auth_token else None,
        "user_id": user.id if user else None,
        "username": user.username if user else None,
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using verified OTP."""
    user = db.query(User).filter(
        or_(User.email == req.identifier, User.phone_number == req.identifier, User.username == req.identifier)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    provided_hash = _hash_otp(req.otp_code)
    token = db.query(OTPToken).filter(
        OTPToken.identifier == req.identifier,
        OTPToken.otp_hash == provided_hash,
        OTPToken.purpose == "FORGOT_PASSWORD"
    ).order_by(OTPToken.created_at.desc()).first()

    if not token or token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP for password reset")

    token.is_verified = True
    user.hashed_password = hash_password(req.new_password)
    db.commit()

    write_audit_log(
        db, action="PASSWORD_RESET",
        actor_id=user.id, actor_name=user.full_name, actor_role=user.role,
        resource_type="USER", resource_id=str(user.id),
        description=f"Password successfully reset via OTP for {user.username}"
    )
    db.commit()

    return {"success": True, "message": "Password reset successfully. You can now login with your new password."}


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT token."""
    user = db.query(User).filter(
        or_(User.username == req.username, User.email == req.username),
        User.is_active == True
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        write_audit_log(
            db, action=AuditActions.LOGIN_FAILED,
            actor_name=req.username, actor_role="UNKNOWN",
            description=f"Failed login attempt for identifier: {req.username}",
            ip_address=request.client.host if request.client else "unknown"
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )

    # Check account status
    if user.account_status in ("BLOCKED",):
        raise HTTPException(status_code=403, detail="Account is blocked. Contact support.")

    token = create_access_token({"sub": user.username, "role": user.role})

    write_audit_log(
        db, action=AuditActions.LOGIN,
        actor_id=user.id, actor_name=user.full_name, actor_role=user.role,
        resource_type="USER", resource_id=str(user.id),
        description=f"Successful login by {user.username}",
        ip_address=request.client.host if request.client else "unknown"
    )
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new demo customer account with simulated NG Bank and ₹10,00,000 balance."""
    if req.confirm_password and req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=req.username,
        email=req.email,
        full_name=req.full_name,
        phone_number=req.phone_number or "+91 98765 43210",
        upi_id=f"{req.username}@nexguard",
        hashed_password=hash_password(req.password),
        role="CUSTOMER",
        account_status="ACTIVE",
    )
    db.add(user)
    db.flush()

    # 1. Create Simulated NG Bank Account with ₹10,00,000 demo balance
    ng_bank = NGBankAccount(
        user_id=user.id,
        account_number=f"NG {random.randint(1000, 9999)} {random.randint(1000, 9999)}",
        account_holder=user.full_name,
        balance=1000000.0,
        currency="INR",
        status="ACTIVE",
        is_connected=True,
    )
    db.add(ng_bank)

    # 2. Create NexGuard Wallet with ₹10,00,000 demo starting balance
    wallet = Wallet(
        user_id=user.id,
        balance=1000000.0,
        currency="INR",
        security_score=95,
        security_status="TRUSTED"
    )
    db.add(wallet)

    # 3. Initialize Digital Twin behavioral profile
    profile = BehaviorProfile(
        user_id=user.id,
        avg_transaction_amount=2500.0,
        std_transaction_amount=1500.0,
        typical_categories=["DINING", "SHOPPING"],
        typical_devices=[],
        typical_locations=["Chennai, IN [SYNTHETIC]"],
    )
    db.add(profile)

    write_audit_log(
        db, action=AuditActions.REGISTER,
        actor_id=user.id, actor_name=user.full_name, actor_role="CUSTOMER",
        description=f"New customer registration: {user.username} with ₹10,00,000 demo balance and NG Bank account"
    )
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(
        access_token=token, token_type="bearer",
        user_id=user.id, username=user.username,
        full_name=user.full_name, role=user.role
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Return current authenticated user's profile."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone_number": current_user.phone_number,
        "upi_id": current_user.upi_id,
        "role": current_user.role,
        "account_status": current_user.account_status,
        "created_at": current_user.created_at.isoformat(),
    }
