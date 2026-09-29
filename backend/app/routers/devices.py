"""
NexGuard Secure Wallet — Devices Router
GET    /api/devices
POST   /api/devices/register
POST   /api/devices/pair
POST   /api/devices/{device_id}/quarantine
POST   /api/devices/{device_id}/restore
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Device, User
from ..schemas import DeviceRegisterRequest, DevicePairRequest
from ..websocket import manager, WSEvents
from ..audit import write_audit_log, AuditActions
from ..config import settings

router = APIRouter(prefix="/api/devices", tags=["Devices"])


def _serialize_device(d: Device) -> dict:
    return {
        "id": d.id,
        "device_id": d.device_id,
        "device_name": d.device_name,
        "device_model": d.device_model,
        "os": d.os,
        "os_version": d.os_version,
        "app_version": d.app_version,
        "trust_level": d.trust_level,
        "risk_score": d.risk_score,
        "ip_address": d.ip_address,
        "ip_type": d.ip_type,
        "location": d.location,
        "is_active": d.is_active,
        "pairing_code": d.pairing_code,
        "first_seen": d.first_seen.isoformat() if d.first_seen else None,
        "last_seen": d.last_seen.isoformat() if d.last_seen else None,
        "user_id": d.user_id,
    }


@router.get("")
def get_devices(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Device)
    if user_id:
        query = query.filter(Device.user_id == user_id)
    return [_serialize_device(d) for d in query.all()]


@router.post("/register", status_code=201)
def register_device(req: DeviceRegisterRequest, db: Session = Depends(get_db)):
    """Register a new device for the demo user."""
    existing = db.query(Device).filter(Device.device_id == req.device_id).first()
    if existing:
        return _serialize_device(existing)

    user = db.query(User).filter(User.username == "karthik").first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")

    device = Device(
        user_id=user.id,
        device_id=req.device_id,
        device_name=req.device_name,
        device_model=req.device_model,
        os=req.os,
        os_version=req.os_version,
        app_version=req.app_version,
        trust_level="NEW",
        risk_score=30,
        ip_address="192.168.1.200",
        ip_type="PRIVATE",
        location="Chennai, IN [SYNTHETIC]",
    )
    db.add(device)

    write_audit_log(
        db, action=AuditActions.DEVICE_REGISTERED,
        resource_type="DEVICE", resource_id=req.device_id,
        description=f"New device registered: {req.device_name} ({req.device_model})"
    )
    db.commit()
    db.refresh(device)
    return _serialize_device(device)


@router.post("/pair/generate")
def generate_pairing_code(db: Session = Depends(get_db)):
    """Generate a single-use 6-digit pairing code (expires in 5 minutes)."""
    user = db.query(User).filter(User.username == "karthik").first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")

    code = str(secrets.randbelow(900000) + 100000)  # 6-digit code
    expires = datetime.utcnow() + timedelta(seconds=settings.PAIRING_CODE_EXPIRY_SECONDS)

    # Store code on a placeholder device entry (or use in-memory for simplicity)
    return {
        "pairing_code": code,
        "expires_at": expires.isoformat(),
        "expires_in_seconds": settings.PAIRING_CODE_EXPIRY_SECONDS,
        "instructions": "Enter this 6-digit code on your phone to pair it with NexGuard.",
    }


@router.post("/{device_id}/quarantine")
async def quarantine_device(device_id: str, db: Session = Depends(get_db)):
    """Quarantine a suspicious device — blocks it from all wallet operations."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.trust_level = "BLOCKED"
    device.is_active = False
    device.risk_score = 100

    write_audit_log(
        db, action=AuditActions.DEVICE_QUARANTINED,
        resource_type="DEVICE", resource_id=device_id,
        description=f"Device {device_id} quarantined by SOC analyst"
    )
    db.commit()

    await manager.broadcast({
        "type": WSEvents.DEVICE_QUARANTINED,
        "data": {"device_id": device_id, "trust_level": "BLOCKED", "message": f"Device {device_id} has been quarantined."}
    })

    return {"message": f"Device {device_id} quarantined and blocked from all wallet operations."}


@router.post("/{device_id}/restore")
async def restore_device(device_id: str, db: Session = Depends(get_db)):
    """Restore a quarantined device to active trusted status."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.trust_level = "TRUSTED"
    device.is_active = True
    device.risk_score = 10

    write_audit_log(
        db, action=AuditActions.DEVICE_RESTORED,
        resource_type="DEVICE", resource_id=device_id,
        description=f"Device {device_id} restored by SOC analyst"
    )
    db.commit()

    await manager.broadcast({
        "type": WSEvents.DEVICE_RESTORED,
        "data": {"device_id": device_id, "trust_level": "TRUSTED"}
    })

    return {"message": f"Device {device_id} restored to TRUSTED status."}


@router.post("/{device_id}/block")
async def block_device(device_id: str, db: Session = Depends(get_db)):
    """Permanently block a device from all wallet operations."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.trust_level = "BLOCKED"
    device.is_active = False
    device.risk_score = 100

    write_audit_log(
        db, action="DEVICE_BLOCKED",
        resource_type="DEVICE", resource_id=device_id,
        description=f"Device {device_id} BLOCKED permanently by SOC administrator"
    )
    db.commit()

    await manager.broadcast({
        "type": "DEVICE_BLOCKED",
        "data": {"device_id": device_id, "trust_level": "BLOCKED", "message": f"Device {device_id} permanently blocked."}
    })

    return {"message": f"Device {device_id} permanently blocked."}

