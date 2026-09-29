"""
NexGuard Secure Wallet — Acceptance & Security Controls Test Suite
Tests:
1. Customer registration, NG Bank creation, and ₹10,00,000 demo balance
2. 6-digit OTP generation and validation
3. NG Bank account connection and balance checks
4. Beneficiary creation and listing
5. Routine payment (₹5,000) allowed and ledger debited
6. Account freezing and verification that payments are blocked with 403 Forbidden
7. Device quarantine and verification that quarantined device payments are blocked with 403 Forbidden
8. High-risk attack blocked with incident creation
9. SOC analyst incident override
"""

import pytest
import asyncio
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import User, Wallet, Device, Beneficiary, NGBankAccount, Incident, Transaction
from app.bootstrap import seed_database
from app.routers.auth import register, generate_otp, verify_otp, RegisterRequest, OTPRequest, OTPVerifyRequest
from app.routers.bank import get_bank_account, connect_bank
from app.routers.beneficiaries import add_beneficiary, get_beneficiaries, BeneficiaryCreate
from app.routers.accounts import freeze_account, unfreeze_account, AccountActionRequest
from app.routers.devices import quarantine_device, restore_device
from app.routers.transactions import create_transaction
from app.routers.incidents import analyst_override, AnalystOverrideRequest
from app.schemas import TransactionCreate

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="module")
def test_db():
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


def test_customer_registration_creates_bank_and_balance(test_db):
    """Test 1: Register customer -> Creates NG Bank + ₹10,00,000 demo balance."""
    req = RegisterRequest(
        username="new_customer",
        email="new_customer@nexguard.bank",
        full_name="New Customer",
        password="securePassword123!",
        confirm_password="securePassword123!",
        phone_number="+91 98888 77777"
    )
    res = asyncio.run(register(req, test_db))
    assert res.username == "new_customer"

    user = test_db.query(User).filter(User.username == "new_customer").first()
    assert user is not None
    assert user.account_status == "ACTIVE"

    # Wallet has ₹10,00,000 balance
    assert user.wallet is not None
    assert user.wallet.balance == 1000000.0

    # Simulated NG Bank account created with ₹10,00,000 balance
    bank = user.ng_bank_account
    assert bank is not None
    assert bank.balance == 1000000.0
    assert "NG" in bank.account_number
    assert bank.is_connected is True


def test_otp_generation_and_verification(test_db):
    """Test 2: 6-digit OTP generation and verification flow."""
    # Request OTP for seeded user Karthik
    otp_req = OTPRequest(identifier="karthik.nair@nexguard.bank", purpose="LOGIN")
    otp_res = asyncio.run(generate_otp(otp_req, test_db))
    assert otp_res["success"] is True
    demo_code = otp_res["demo_otp"]
    assert len(demo_code) == 6

    # Verify with correct code
    verify_req = OTPVerifyRequest(identifier="karthik.nair@nexguard.bank", otp_code=demo_code, purpose="LOGIN")
    verify_res = asyncio.run(verify_otp(verify_req, test_db))
    assert verify_res["verified"] is True
    assert verify_res.get("access_token") is not None


def test_ng_bank_account_connection(test_db):
    """Test 3: NG Bank account query and connection."""
    user = test_db.query(User).filter(User.username == "karthik").first()
    acc_info = get_bank_account(test_db, current_user=user)
    assert acc_info["bank_name"] == "NG Bank"
    assert acc_info["available_balance"] == 1000000.0
    assert acc_info["is_connected"] is True

    connect_res = asyncio.run(connect_bank(test_db, current_user=user))
    assert connect_res["success"] is True
    assert connect_res["message"] == "NG Bank Connected"


def test_beneficiary_management(test_db):
    """Test 4: Add beneficiary and retrieve list."""
    user = test_db.query(User).filter(User.username == "karthik").first()
    b_req = BeneficiaryCreate(
        name="Rohan Varma",
        mobile="+91 99112 23344",
        upi_id="rohan@oksbi",
        relationship="FRIEND",
        category="PEER"
    )
    b_res = asyncio.run(add_beneficiary(b_req, test_db, current_user=user))
    assert b_res["name"] == "Rohan Varma"
    assert b_res["status"] == "ACTIVE"

    b_list = get_beneficiaries(test_db, current_user=user)
    assert any(b["upi_id"] == "rohan@oksbi" for b in b_list)


def test_payment_and_ledger_settlement(test_db):
    """Test 5: Send ₹5,000 to beneficiary -> ALLOW -> Balance debited."""
    user = test_db.query(User).filter(User.username == "karthik").first()
    initial_balance = user.wallet.balance

    # Ensure user has a trusted device
    device = Device(
        user_id=user.id,
        device_id="DEVICE-KARTHIK-TEST-01",
        device_name="Karthik Phone",
        trust_level="TRUSTED",
        risk_score=5,
        ip_address="192.168.1.150",
        location="Chennai, IN [SYNTHETIC]"
    )
    test_db.add(device)
    test_db.commit()

    txn_req = TransactionCreate(
        amount=5000.0,
        merchant="Rohan Varma",
        merchant_category="PEER",
        device_id="DEVICE-KARTHIK-TEST-01",
        location="Chennai, IN [SYNTHETIC]",
        demo_ip="192.168.1.150",
        ip_type="PRIVATE",
        biometric_verified=True,
        biometric_confidence=0.98
    )
    res = asyncio.run(create_transaction(txn_req, DummyRequest(), test_db, current_user=user))
    assert res["status"] in ("ALLOW", "COMPLETED")
    assert user.wallet.balance == initial_balance - 5000.0


def test_account_freeze_blocks_transactions(test_db):
    """Test 6: SOC Admin freezes account -> Any subsequent payment rejected with 403."""
    user = test_db.query(User).filter(User.username == "karthik").first()
    action_req = AccountActionRequest(reason="Suspicious activity reported by customer", actor_role="ADMIN")
    freeze_res = asyncio.run(freeze_account(user.id, action_req, test_db))
    assert freeze_res["success"] is True
    assert user.account_status == "FROZEN"

    # Now attempt a transaction — must fail with 403 Forbidden
    txn_req = TransactionCreate(
        amount=1000.0,
        merchant="Swiggy",
        device_id="DEVICE-KARTHIK-TEST-01"
    )
    with pytest.raises(HTTPException) as excinfo:
        asyncio.run(create_transaction(txn_req, DummyRequest(), test_db, current_user=user))
    assert excinfo.value.status_code == 403
    assert "FROZEN" in excinfo.value.detail

    # Restore account
    asyncio.run(unfreeze_account(user.id, AccountActionRequest(reason="Security check complete"), test_db))
    assert user.account_status == "ACTIVE"


def test_device_quarantine_blocks_transactions(test_db):
    """Test 7: SOC Admin quarantines device -> Payments from this device rejected with 403."""
    user = test_db.query(User).filter(User.username == "karthik").first()
    # Quarantine device
    asyncio.run(quarantine_device("DEVICE-KARTHIK-TEST-01", test_db))

    device = test_db.query(Device).filter(Device.device_id == "DEVICE-KARTHIK-TEST-01").first()
    assert device.trust_level == "BLOCKED"

    txn_req = TransactionCreate(
        amount=1000.0,
        merchant="Swiggy",
        device_id="DEVICE-KARTHIK-TEST-01"
    )
    with pytest.raises(HTTPException) as excinfo:
        asyncio.run(create_transaction(txn_req, DummyRequest(), test_db, current_user=user))
    assert excinfo.value.status_code == 403
    assert "quarantined" in excinfo.value.detail.lower() or "blocked" in excinfo.value.detail.lower()

    # Restore device
    asyncio.run(restore_device("DEVICE-KARTHIK-TEST-01", test_db))
    assert device.trust_level == "TRUSTED"

