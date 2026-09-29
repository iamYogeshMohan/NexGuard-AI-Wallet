"""
NexGuard Secure Wallet — Pydantic v2 Schemas (Request/Response Models)
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    phone_number: Optional[str] = "+91 98765 43210"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    full_name: str
    role: str


# ─── Wallet ───────────────────────────────────────────────────────────────────

class AddMoneyRequest(BaseModel):
    amount: float = Field(..., gt=0, le=100000)
    source: str = "NetBanking HDFC"

class WalletResponse(BaseModel):
    user_id: int
    full_name: str
    username: str
    email: str
    phone_number: Optional[str]
    upi_id: Optional[str]
    balance: float
    currency: str
    security_score: int
    security_status: str
    devices: List[Dict[str, Any]] = []


# ─── Transactions ─────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0, le=500000)
    currency: str = "INR"
    merchant: str
    merchant_category: str = "RETAIL"
    transaction_type: str = "UPI_TRANSFER"
    payment_method: str = "UPI"
    purpose: Optional[str] = None
    recipient_upi: Optional[str] = None

    # Telemetry
    device_id: str = "DEVICE-001"
    session_id: str = "SES-1024"
    location: str = "Chennai, IN [SYNTHETIC]"
    demo_ip: Optional[str] = None  # Client-supplied demo IP for simulation
    ip_type: Optional[str] = None

    # Biometric (simulated)
    biometric_verified: bool = True
    biometric_confidence: float = Field(default=0.95, ge=0.0, le=1.0)

    # Auth
    pin: Optional[str] = None

    # Idempotency
    idempotency_key: Optional[str] = None

class StepUpVerifyRequest(BaseModel):
    verification_type: str = "BIOMETRIC"  # OTP, BIOMETRIC, PIN
    otp_code: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    transaction_id_str: str
    amount: float
    currency: str
    merchant: str
    merchant_category: str
    status: str
    risk_score: int
    agent_scores: Dict[str, Any]
    xai_factors: List[Dict[str, Any]]
    reasons: List[str]
    incident_id: Optional[str]
    step_up_token: Optional[str]
    remaining_balance: Optional[float]
    execution_time_ms: Optional[float]
    created_at: str


# ─── Devices ──────────────────────────────────────────────────────────────────

class DeviceRegisterRequest(BaseModel):
    device_id: str
    device_name: str
    device_model: str
    os: str = "Android"
    os_version: str
    app_version: str = "2.0.0"

class DevicePairRequest(BaseModel):
    pairing_code: str

class DeviceResponse(BaseModel):
    id: int
    device_id: str
    device_name: str
    device_model: str
    os_version: str
    trust_level: str
    risk_score: int
    ip_address: str
    ip_type: str
    location: str
    is_active: bool
    first_seen: str
    last_seen: str


# ─── Incidents ────────────────────────────────────────────────────────────────

class IncidentResolveRequest(BaseModel):
    notes: Optional[str] = None

class AnalystOverrideRequest(BaseModel):
    action: str  # KEEP_BLOCKED or APPROVE_OVERRIDE
    reason: str

class IncidentResponse(BaseModel):
    id: int
    incident_id: str
    title: str
    severity: str
    status: str
    description: Optional[str]
    risk_score: int
    agent_evidence: Dict[str, Any]
    xai_factors: List[Dict[str, Any]]
    analyst_notes: Optional[str]
    analyst_action: Optional[str]
    created_at: str
    resolved_at: Optional[str]


# ─── Threat Intelligence ──────────────────────────────────────────────────────

class ThreatIntelResponse(BaseModel):
    id: int
    indicator: str
    indicator_type: str
    source: str
    severity: str
    confidence: int
    description: str
    tags: List[str]
    first_seen: str
    last_seen: str


# ─── Copilot ──────────────────────────────────────────────────────────────────

class CopilotRequest(BaseModel):
    question: str

class CopilotResponse(BaseModel):
    question: str
    answer: str
    data: Optional[Dict[str, Any]] = None
    confidence: str = "HIGH"


# ─── Reports ──────────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    report_type: str  # TRANSACTION, FRAUD, INCIDENT, DEVICE_RISK, AGENT_PERFORMANCE
    format: str = "JSON"  # JSON, CSV
    days: int = 7
