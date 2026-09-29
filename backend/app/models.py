"""
NexGuard Secure Wallet — Complete Database Models
All tables specified in the Master Build Prompt.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Index, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from .database import Base
import enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    ANALYST = "ANALYST"
    ADMIN = "ADMIN"

class DeviceTrustLevel(str, enum.Enum):
    TRUSTED = "TRUSTED"
    NEW = "NEW"
    SUSPICIOUS = "SUSPICIOUS"
    BLOCKED = "BLOCKED"

class TransactionStatus(str, enum.Enum):
    CREATED = "CREATED"
    ANALYZING = "ANALYZING"
    ALLOW = "ALLOW"
    VERIFY = "VERIFY"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"

class IncidentSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"

class IPType(str, enum.Enum):
    PRIVATE = "PRIVATE"
    PUBLIC = "PUBLIC"
    UNKNOWN = "UNKNOWN"
    VPN = "VPN"
    TOR = "TOR"


# ─── User ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), default="+91 98765 43210")
    upi_id = Column(String(50), nullable=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default=UserRole.CUSTOMER)
    account_status = Column(String(20), default="ACTIVE")  # ACTIVE, RESTRICTED, FROZEN, BLOCKED
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    ng_bank_account = relationship("NGBankAccount", back_populates="user", uselist=False, cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user")
    beneficiaries = relationship("Beneficiary", back_populates="user", cascade="all, delete-orphan")
    behavior_profile = relationship("BehaviorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


# ─── NG Bank Account (Simulated) ──────────────────────────────────────────────

class NGBankAccount(Base):
    __tablename__ = "ng_bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    account_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g. NG 4092 8819
    account_holder = Column(String(100), nullable=False)
    bank_name = Column(String(100), default="NG Bank (Simulated)")
    branch_ifsc = Column(String(20), default="NGBK0001024")
    balance = Column(Float, default=1000000.0)  # ₹10,00,000 demo starting balance
    currency = Column(String(10), default="INR")
    status = Column(String(20), default="ACTIVE")  # ACTIVE, FROZEN, BLOCKED
    is_connected = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="ng_bank_account")


# ─── Wallet ───────────────────────────────────────────────────────────────────

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    balance = Column(Float, default=1000000.0)  # ₹10,00,000 per master prompt
    currency = Column(String(10), default="INR")
    status = Column(String(20), default="ACTIVE")  # ACTIVE, RESTRICTED, FROZEN, BLOCKED
    security_score = Column(Integer, default=94)  # 0–100
    security_status = Column(String(20), default="TRUSTED")  # TRUSTED, GUARDED, AT_RISK
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="wallet")


# ─── OTP Token ────────────────────────────────────────────────────────────────

class OTPToken(Base):
    __tablename__ = "otp_tokens"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(100), index=True, nullable=False)  # Phone or email
    otp_hash = Column(String(200), nullable=False)
    purpose = Column(String(50), default="VERIFICATION")  # LOGIN, REGISTRATION, STEP_UP, FORGOT_PASSWORD
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    is_verified = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    cooldown_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Device ───────────────────────────────────────────────────────────────────

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    device_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g. DEVICE-001
    device_name = Column(String(100))   # e.g. Karthik's Pixel 8
    device_model = Column(String(100))  # Google Pixel 8
    os = Column(String(50), default="Android")
    os_version = Column(String(50))     # Android 14
    app_version = Column(String(20), default="2.0.0")
    browser = Column(String(50), nullable=True)
    trust_level = Column(String(20), default=DeviceTrustLevel.TRUSTED)
    risk_score = Column(Integer, default=5)       # 0–100
    ip_address = Column(String(50), default="192.168.1.100")
    ip_type = Column(String(20), default=IPType.PRIVATE)
    location = Column(String(100), default="Chennai, IN [SYNTHETIC]")
    is_active = Column(Boolean, default=True)
    pairing_code = Column(String(20), nullable=True)
    pairing_code_expires = Column(DateTime, nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="devices")
    sessions = relationship("DeviceSession", back_populates="device", cascade="all, delete-orphan")


# ─── Device Session ───────────────────────────────────────────────────────────

class DeviceSession(Base):
    __tablename__ = "device_sessions"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    session_token = Column(String(100), unique=True, index=True)
    session_id_str = Column(String(50), index=True)  # e.g. SES-1024
    ip_address = Column(String(50))
    location = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    last_activity = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    device = relationship("Device", back_populates="sessions")


# ─── Beneficiary ──────────────────────────────────────────────────────────────

class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(100), nullable=False)
    upi_id = Column(String(100), nullable=False)
    mobile = Column(String(20), nullable=True)
    relationship_type = Column("relationship", String(50), default="FRIEND")  # FRIEND, FAMILY, BUSINESS, MERCHANT
    account_number = Column(String(50), nullable=True)
    bank_name = Column(String(100), nullable=True)
    category = Column(String(50), default="RETAIL")  # DINING, SHOPPING, PEER, WIRE, CRYPTO
    trust_score = Column(Integer, default=80)         # 0–100
    risk_score = Column(Integer, default=10)          # 0–100
    status = Column(String(20), default="ACTIVE")      # ACTIVE, RESTRICTED, BLOCKED
    risk_status = Column(String(20), default="LOW")    # LOW, MEDIUM, HIGH
    is_verified = Column(Boolean, default=False)
    is_new = Column(Boolean, default=True)
    total_transactions = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_transaction_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="beneficiaries")


# ─── Behavior Profile (Digital Twin) ─────────────────────────────────────────

class BehaviorProfile(Base):
    __tablename__ = "behavior_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    # Amount profile
    avg_transaction_amount = Column(Float, default=2500.0)
    std_transaction_amount = Column(Float, default=1500.0)
    min_amount = Column(Float, default=100.0)
    max_amount = Column(Float, default=10000.0)
    # Time profile
    typical_hours_start = Column(Integer, default=9)   # 09:00
    typical_hours_end = Column(Integer, default=22)    # 22:00
    # Frequency profile
    avg_transactions_per_day = Column(Float, default=2.0)
    max_transactions_per_day = Column(Integer, default=5)
    # Location & Device profile (JSON)
    typical_devices = Column(JSON, default=list)       # ["DEVICE-001"]
    typical_locations = Column(JSON, default=list)     # ["Chennai, IN"]
    typical_categories = Column(JSON, default=list)    # ["DINING", "SHOPPING"]
    # Behavioral fingerprint
    transaction_count = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="behavior_profile")


# ─── Transaction ──────────────────────────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("idx_txn_user_created", "user_id", "created_at"),
        Index("idx_txn_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    transaction_id_str = Column(String(50), unique=True, index=True)  # TXN-XXXXXXXX
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    # Payment details
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    merchant = Column(String(100), nullable=False)
    merchant_category = Column(String(50), default="RETAIL")
    transaction_type = Column(String(50), default="UPI_TRANSFER")
    payment_method = Column(String(20), default="UPI")
    purpose = Column(String(200), nullable=True)
    # Telemetry
    device_id = Column(String(50), default="DEVICE-001")
    session_id = Column(String(50), default="SES-1024")
    location = Column(String(100), default="Chennai, IN [SYNTHETIC]")
    ip_address = Column(String(50), default="192.168.1.100")
    ip_type = Column(String(30), default="PRIVATE")
    source_ip = Column(String(50), nullable=True)  # Server-observed request IP
    # Biometric telemetry (simulated)
    biometric_verified = Column(Boolean, default=False)
    biometric_confidence = Column(Float, default=0.95)
    # Security analysis
    status = Column(String(30), default=TransactionStatus.CREATED)
    risk_score = Column(Integer, default=0)          # 0–100 composite
    agent_scores = Column(JSON, default=dict)         # Per-agent scores
    agent_reasons = Column(JSON, default=dict)        # Per-agent reasons
    xai_factors = Column(JSON, default=list)          # XAI contribution factors
    reasons = Column(JSON, default=list)              # Final display reasons
    # Step-up verification
    step_up_token = Column(String(100), nullable=True)
    step_up_verified = Column(Boolean, default=False)
    step_up_type = Column(String(50), nullable=True)  # OTP, BIOMETRIC
    # Incident link
    incident_id = Column(String(50), nullable=True)
    # Ledger state
    ledger_debited = Column(Boolean, default=False)
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="transactions")


# ─── Security Event ───────────────────────────────────────────────────────────

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    device_id = Column(String(50), nullable=True)
    event_type = Column(String(50), nullable=False)  # FAILED_LOGIN, DEVICE_BLOCKED, etc.
    severity = Column(String(20), default="LOW")
    description = Column(Text)
    event_metadata = Column("event_metadata", JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Risk Assessment ──────────────────────────────────────────────────────────

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True)
    composite_score = Column(Integer, nullable=False)
    agent_scores = Column(JSON, default=dict)
    agent_weights = Column(JSON, default=dict)
    agent_confidence = Column(JSON, default=dict)
    xai_factors = Column(JSON, default=list)
    decision = Column(String(20), nullable=False)  # ALLOW, VERIFY, BLOCK
    policy_version = Column(String(20), default="v2.0")
    execution_time_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Incident ─────────────────────────────────────────────────────────────────

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True)  # INC-XXXX
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    transaction_id_str = Column(String(50), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    device_id = Column(String(50), nullable=True)
    title = Column(String(200), nullable=False)
    severity = Column(String(20), default=IncidentSeverity.HIGH)
    status = Column(String(20), default=IncidentStatus.OPEN)
    description = Column(Text, nullable=True)
    agent_evidence = Column(JSON, default=dict)
    xai_factors = Column(JSON, default=list)
    risk_score = Column(Integer, default=0)
    # Analyst interaction
    analyst_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    analyst_notes = Column(Text, nullable=True)
    analyst_action = Column(String(50), nullable=True)  # KEEP_BLOCKED, APPROVE_OVERRIDE
    override_reason = Column(Text, nullable=True)
    # Timeline
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")


# ─── Incident Event ───────────────────────────────────────────────────────────

class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id_fk = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"))
    event_type = Column(String(50))  # NOTE, STATUS_CHANGE, ANALYST_ACTION
    actor = Column(String(100), default="SYSTEM")
    description = Column(Text)
    event_metadata = Column("event_metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="events")


# ─── Threat Intelligence ──────────────────────────────────────────────────────

class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"

    id = Column(Integer, primary_key=True, index=True)
    indicator = Column(String(200), unique=True, index=True, nullable=False)
    indicator_type = Column(String(20), nullable=False)  # IP, DOMAIN, URL, HASH
    source = Column(String(100), default="SYNTHETIC — NexGuard Internal")
    severity = Column(String(20), default="MEDIUM")
    confidence = Column(Integer, default=75)  # 0–100
    description = Column(Text)
    tags = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ─── Notification ─────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO")  # ALERT, WARNING, INFO, SUCCESS
    is_read = Column(Boolean, default=False)
    related_transaction_id = Column(String(50), nullable=True)
    related_incident_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_actor_created", "actor_id", "created_at"),
        Index("idx_audit_action", "action"),
    )

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(100), nullable=True)
    actor_role = Column(String(20), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, TRANSACTION_CREATED, etc.
    resource_type = Column(String(50), nullable=True)  # TRANSACTION, DEVICE, INCIDENT
    resource_id = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    event_metadata = Column("event_metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs", foreign_keys=[actor_id])


# ─── Cryptographic Asset ──────────────────────────────────────────────────────

class CryptographicAsset(Base):
    __tablename__ = "cryptographic_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_name = Column(String(100), nullable=False)
    algorithm = Column(String(100), nullable=False)  # RSA-2048, AES-256, Kyber-1024
    key_size = Column(Integer, nullable=True)
    protocol = Column(String(50), nullable=True)     # TLS 1.3, TLS 1.2
    usage = Column(String(100), nullable=True)       # User Authentication, Data Encryption
    data_sensitivity = Column(String(20), default="HIGH")
    data_lifetime_years = Column(Integer, default=10)
    pqc_ready = Column(Boolean, default=False)
    quantum_risk_level = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    recommendation = Column(Text, nullable=True)
    migration_status = Column(String(50), default="NOT_STARTED")  # NOT_STARTED, IN_PROGRESS, COMPLETED
    nist_standard = Column(String(50), nullable=True)  # FIPS 203, FIPS 204
    created_at = Column(DateTime, default=datetime.utcnow)
    last_assessed = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ─── Security Policy ──────────────────────────────────────────────────────────

class SecurityPolicy(Base):
    __tablename__ = "security_policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    risk_allow_max = Column(Integer, default=30)
    risk_verify_max = Column(Integer, default=60)
    agent_weights = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    version = Column(String(20), default="v2.0")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
