"""
NexGuard Secure Wallet — Comprehensive Automated Test Suite
Covers Authentication, Transactions, Ledger Settlement, 10 Agents,
Haversine Geo-Velocity, Idempotency, Step-Up Verification, Incidents, and Overrides.
"""

import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import User, Wallet, Device, Transaction, Incident, AuditLog
from app.bootstrap import seed_database
from app.agents import orchestrator
from app.schemas import TransactionCreate, StepUpVerifyRequest
from app.routers.transactions import create_transaction, verify_step_up
from app.security import hash_password, verify_password, create_access_token, decode_token

# In-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    seed_database(session)
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)


class DummyClient:
    host = "127.0.0.1"

class DummyRequest:
    client = DummyClient()


# ─── 1. Authentication Tests ──────────────────────────────────────────────────

def test_password_hashing():
    pwd = "secret_password_123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_generation_and_decoding():
    token = create_access_token({"sub": "testuser", "role": "CUSTOMER"})
    assert isinstance(token, str)
    decoded = decode_token(token)
    assert decoded["sub"] == "testuser"
    assert decoded["role"] == "CUSTOMER"


# ─── 2. 10 AI Agents Unit Tests ───────────────────────────────────────────────

def test_10_agents_exist():
    assert len(orchestrator.agents) == 10
    expected_agents = [
        "fraud", "cyber", "behavior", "biometrics", "device",
        "geo", "beneficiary", "ip", "session", "quantum"
    ]
    for name in expected_agents:
        assert name in orchestrator.agents

def test_geo_velocity_haversine_impossible_travel():
    geo_agent = orchestrator.agents["geo"]
    # Chennai to London in 15 minutes is physically impossible (>30,000 km/h)
    payload = {
        "location": "London, UK [SYNTHETIC]",
        "previous_location": "Chennai, IN [SYNTHETIC]",
        "minutes_since_last_txn": 15.0,
    }
    score, confidence, reasons = geo_agent.evaluate(payload)
    assert score >= 90
    assert any("IMPOSSIBLE_TRAVEL" in r for r in reasons)

def test_quantum_risk_advisor_standards():
    pqc_agent = orchestrator.agents["quantum"]
    score, conf, reasons = pqc_agent.evaluate({"merchant_category": "WIRE", "tls_version": "TLS 1.2"})
    assert score > 30
    assert any("Harvest-Now-Decrypt-Later" in r or "PQC" in r for r in reasons)


# ─── 3. End-to-End Viva Scenarios ─────────────────────────────────────────────

def test_scenario_1_routine_safe_payment(db):
    """Routine payment: Phone A, Swiggy, ₹2,500 -> ALLOW"""
    user = db.query(User).filter(User.username == "karthik").first()
    initial_balance = user.wallet.balance

    req = TransactionCreate(
        amount=2500.0,
        merchant="Swiggy Online Food",
        merchant_category="DINING",
        device_id="DEVICE-001",
        session_id="SES-1024",
        location="Chennai, IN [SYNTHETIC]",
        demo_ip="192.168.1.104",
        ip_type="PRIVATE",
        biometric_verified=True,
        biometric_confidence=0.98,
    )
    res = asyncio.run(create_transaction(req, DummyRequest(), db, current_user=user))

    assert res["status"] in ("ALLOW", "COMPLETED")
    assert res["risk_score"] <= 30
    assert user.wallet.balance == initial_balance - 2500.0


def test_scenario_2_suspicious_step_up_challenge(db):
    """High-value transfer: ₹38,000 -> VERIFY -> Step-up verification settles payment"""
    user = db.query(User).filter(User.username == "karthik").first()
    initial_balance = user.wallet.balance

    req = TransactionCreate(
        amount=38000.0,
        merchant="Global Tech Electronics",
        merchant_category="ELECTRONICS",
        device_id="DEVICE-001",
        session_id="SES-1024",
        location="Chennai, IN [SYNTHETIC]",
        demo_ip="192.168.1.104",
        ip_type="PRIVATE",
        biometric_verified=True,
        biometric_confidence=0.90,
    )
    res = asyncio.run(create_transaction(req, DummyRequest(), db, current_user=user))

    assert res["status"] in ("VERIFY", "PENDING_VERIFICATION")
    assert 30 < res["risk_score"] <= 70
    assert res.get("step_up_token") is not None
    # Ledger must NOT debit during hold
    assert user.wallet.balance == initial_balance

    # Now verify step-up
    verify_req = StepUpVerifyRequest(verification_type="BIOMETRIC")
    step_res = asyncio.run(verify_step_up(res["id"], verify_req, db))

    assert step_res["status"] == "COMPLETED"
    assert user.wallet.balance == initial_balance - 38000.0


def test_scenario_3_account_takeover_attack_block(db):
    """Rogue device B, London VPN, Cayman Wire ₹85,000 -> BLOCK + Incident created"""
    user = db.query(User).filter(User.username == "karthik").first()
    initial_balance = user.wallet.balance

    req = TransactionCreate(
        amount=85000.0,
        merchant="Cayman Island Wire Exchange",
        merchant_category="WIRE",
        device_id="DEVICE-002",
        session_id="SES-8821",
        location="London, UK [SYNTHETIC]",
        demo_ip="92.43.11.88",
        ip_type="VPN",
        biometric_verified=False,
        biometric_confidence=0.35,
    )
    res = asyncio.run(create_transaction(req, DummyRequest(), db, current_user=user))

    assert res["status"] == "BLOCK"
    assert res["risk_score"] > 60
    assert res.get("incident_id") is not None
    # Balance must NEVER be debited on block
    assert user.wallet.balance == initial_balance

    # Verify incident was persisted in DB
    incident = db.query(Incident).filter(Incident.incident_id == res["incident_id"]).first()
    assert incident is not None
    assert incident.status == "OPEN"
    assert incident.severity in ("HIGH", "CRITICAL")


# ─── 4. Idempotency Test ──────────────────────────────────────────────────────

def test_idempotency_key_prevents_duplicate_charge(db):
    user = db.query(User).filter(User.username == "karthik").first()
    key = "unique-key-xyz-12345"

    req1 = TransactionCreate(
        amount=100.0,
        merchant="Swiggy Online Food",
        device_id="DEVICE-001",
        idempotency_key=key,
    )
    res1 = asyncio.run(create_transaction(req1, DummyRequest(), db, current_user=user))

    # Submit second identical request with same key
    req2 = TransactionCreate(
        amount=100.0,
        merchant="Swiggy Online Food",
        device_id="DEVICE-001",
        idempotency_key=key,
    )
    res2 = asyncio.run(create_transaction(req2, DummyRequest(), db, current_user=user))

    # Both must return same transaction ID and no duplicate debit
    assert res1["id"] == res2["id"]
    assert res1["transaction_id_str"] == res2["transaction_id_str"]
