"""
NexGuard Secure Wallet — Audit Log Service
"""

from datetime import datetime
from sqlalchemy.orm import Session
from .models import AuditLog


def write_audit_log(
    db: Session,
    action: str,
    actor_id: int = None,
    actor_name: str = None,
    actor_role: str = None,
    resource_type: str = None,
    resource_id: str = None,
    description: str = None,
    ip_address: str = None,
    metadata: dict = None,
):
    """Write an immutable audit log entry. Never raises — logs silently."""
    try:
        log = AuditLog(
            actor_id=actor_id,
            actor_name=actor_name or "SYSTEM",
            actor_role=actor_role or "SYSTEM",
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            description=description,
            ip_address=ip_address,
            event_metadata=metadata or {},
            created_at=datetime.utcnow(),
        )
        db.add(log)
        db.flush()  # Don't commit — let caller control the transaction
    except Exception as e:
        # Audit logging must never crash the application
        import logging
        logging.getLogger("nexguard.audit").error(f"Audit log write failed: {e}")


# ─── Audit Event Constants ────────────────────────────────────────────────────

class AuditActions:
    # Auth
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    REGISTER = "REGISTER"
    LOGIN_FAILED = "LOGIN_FAILED"

    # Transactions
    TRANSACTION_CREATED = "TRANSACTION_CREATED"
    TRANSACTION_ALLOWED = "TRANSACTION_ALLOWED"
    VERIFICATION_REQUESTED = "VERIFICATION_REQUESTED"
    TRANSACTION_VERIFIED = "TRANSACTION_VERIFIED"
    TRANSACTION_BLOCKED = "TRANSACTION_BLOCKED"

    # Devices
    DEVICE_REGISTERED = "DEVICE_REGISTERED"
    DEVICE_QUARANTINED = "DEVICE_QUARANTINED"
    DEVICE_RESTORED = "DEVICE_RESTORED"
    DEVICE_PAIRED = "DEVICE_PAIRED"

    # Incidents
    INCIDENT_CREATED = "INCIDENT_CREATED"
    INCIDENT_RESOLVED = "INCIDENT_RESOLVED"
    ANALYST_OVERRIDE = "ANALYST_OVERRIDE"

    # Policy
    POLICY_CHANGED = "POLICY_CHANGED"

    # Wallet
    WALLET_DEPOSIT = "WALLET_DEPOSIT"
