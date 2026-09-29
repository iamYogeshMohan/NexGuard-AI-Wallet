"""
NexGuard Secure Wallet — Database Bootstrapper
Seeds demo customer, SOC analyst, devices, beneficiaries,
threat intelligence, cryptographic assets, and historical transactions.
"""

import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, Wallet, Device, Beneficiary, Transaction,
    Incident, BehaviorProfile, CryptographicAsset,
    ThreatIntelligence, AuditLog, NGBankAccount
)
from .security import hash_password
from .config import settings


def seed_database(db: Session):
    # Check if database already seeded
    existing_user = db.query(User).filter(User.username == settings.DEMO_USER_USERNAME).first()
    if existing_user:
        ensure_peer_users(db)
        return

    print("[Bootstrap] Seeding database for NexGuard Secure Wallet...")

    # 1. Customer User: Karthik Nair (c1024 / karthik)
    customer = User(
        username=settings.DEMO_USER_USERNAME,
        email="karthik.nair@nexguard.bank",
        full_name="Karthik Nair",
        phone_number="+91 98765 43210",
        upi_id="karthik@nexguard",
        hashed_password=hash_password(settings.DEMO_USER_PASSWORD),
        role="CUSTOMER",
        account_status="ACTIVE",
        is_active=True,
    )
    db.add(customer)

    # 2. SOC Analyst User: Priya Sharma
    analyst = User(
        username=settings.ANALYST_USERNAME,
        email="analyst@nexguard.bank",
        full_name="Priya Sharma (SOC Lead)",
        phone_number="+91 98765 00001",
        upi_id="soc.desk@nexguard",
        hashed_password=hash_password(settings.ANALYST_PASSWORD),
        role="ANALYST",
        account_status="ACTIVE",
        is_active=True,
    )
    db.add(analyst)
    db.flush()

    # 3. Simulated NG Bank Account (₹10,00,000 initial demo balance)
    ng_bank = NGBankAccount(
        user_id=customer.id,
        account_number="NG 4092 8819",
        account_holder="Karthik Nair",
        bank_name="NG Bank (Simulated)",
        branch_ifsc="NGBK0001024",
        balance=settings.DEMO_BALANCE,
        currency="INR",
        status="ACTIVE",
        is_connected=True,
    )
    db.add(ng_bank)

    # 4. Customer Wallet (₹10,00,000 balance per Master Build Prompt)
    wallet = Wallet(
        user_id=customer.id,
        balance=settings.DEMO_BALANCE,
        currency="INR",
        status="ACTIVE",
        security_score=94,
        security_status="TRUSTED"
    )
    db.add(wallet)

    # 4. Digital Twin Behavioral Profile
    twin = BehaviorProfile(
        user_id=customer.id,
        avg_transaction_amount=3200.0,
        std_transaction_amount=1800.0,
        min_amount=100.0,
        max_amount=15000.0,
        typical_hours_start=9,
        typical_hours_end=22,
        avg_transactions_per_day=2.4,
        max_transactions_per_day=6,
        typical_devices=["DEVICE-001"],
        typical_locations=["Chennai, IN [SYNTHETIC]"],
        typical_categories=["DINING", "SHOPPING", "UTILITIES"],
        transaction_count=24
    )
    db.add(twin)

    # 5. Devices: Phone A (Trusted), Phone B (Rogue/VPN), Phone C (New pairing test)
    phone_a = Device(
        user_id=customer.id,
        device_id="DEVICE-001",
        device_name="Karthik's Pixel 8",
        device_model="Google Pixel 8",
        os="Android",
        os_version="Android 14",
        app_version="2.0.0",
        trust_level="TRUSTED",
        risk_score=5,
        ip_address="192.168.1.104",
        ip_type="PRIVATE",
        location="Chennai, IN [SYNTHETIC]",
        is_active=True
    )
    phone_b = Device(
        user_id=customer.id,
        device_id="DEVICE-002",
        device_name="Samsung S24 (Unregistered)",
        device_model="Samsung Galaxy S24 Ultra",
        os="Android",
        os_version="Android 14",
        app_version="2.0.0",
        trust_level="SUSPICIOUS",
        risk_score=78,
        ip_address="92.43.11.88",
        ip_type="VPN",
        location="London, UK [SYNTHETIC]",
        is_active=True
    )
    phone_c = Device(
        user_id=customer.id,
        device_id="DEVICE-003",
        device_name="iPhone 15 Pro (Pending Verification)",
        device_model="Apple iPhone 15 Pro",
        os="iOS",
        os_version="iOS 17.4",
        app_version="2.0.0",
        trust_level="NEW",
        risk_score=35,
        ip_address="192.168.1.108",
        ip_type="PRIVATE",
        location="Chennai, IN [SYNTHETIC]",
        is_active=True
    )
    db.add_all([phone_a, phone_b, phone_c])

    # 6. Beneficiaries
    b1 = Beneficiary(user_id=customer.id, name="Swiggy Online Food", upi_id="swiggy@icici", mobile="+91 98111 22233", relationship_type="MERCHANT", category="DINING", trust_score=98, risk_score=5, status="ACTIVE", risk_status="LOW", is_verified=True, is_new=False, total_transactions=14, total_amount=12400.0)
    b2 = Beneficiary(user_id=customer.id, name="Amazon India", upi_id="amazon@apl", mobile="+91 98222 33344", relationship_type="MERCHANT", category="SHOPPING", trust_score=95, risk_score=8, status="ACTIVE", risk_status="LOW", is_verified=True, is_new=False, total_transactions=8, total_amount=28900.0)
    b3 = Beneficiary(user_id=customer.id, name="Aarav Sharma", upi_id="aarav@oksbi", mobile="+91 98333 44455", relationship_type="FRIEND", category="PEER", trust_score=90, risk_score=10, status="ACTIVE", risk_status="LOW", is_verified=True, is_new=False, total_transactions=5, total_amount=7500.0)
    b4 = Beneficiary(user_id=customer.id, name="Global Tech Electronics", upi_id="globaltech@hdfc", mobile="+91 98444 55566", relationship_type="BUSINESS", category="ELECTRONICS", trust_score=68, risk_score=45, status="ACTIVE", risk_status="MEDIUM", is_verified=False, is_new=True, total_transactions=1, total_amount=35000.0)
    b5 = Beneficiary(user_id=customer.id, name="Cayman Island Wire Exchange", upi_id="cayman.wire@offshore", mobile="+44 7911 123456", relationship_type="WIRE", category="WIRE", trust_score=15, risk_score=92, status="RESTRICTED", risk_status="HIGH", is_verified=False, is_new=True, is_flagged=True, flag_reason="Offshore mule indicator", total_transactions=0, total_amount=0.0)
    db.add_all([b1, b2, b3, b4, b5])

    # 7. NIST Post-Quantum Cryptography Assets Catalog
    c1 = CryptographicAsset(
        asset_name="Wallet REST API TLS Termination",
        algorithm="Kyber-1024",
        key_size=1024,
        protocol="TLS 1.3",
        usage="Transport Layer Hybrid Key Encapsulation",
        data_sensitivity="HIGH",
        data_lifetime_years=10,
        pqc_ready=True,
        quantum_risk_level="LOW",
        recommendation="PQC-ready. Standardized under NIST FIPS 203 (ML-KEM).",
        migration_status="COMPLETED",
        nist_standard="FIPS 203 (ML-KEM)"
    )
    c2 = CryptographicAsset(
        asset_name="Customer JWT Session Signing",
        algorithm="RSA-2048",
        key_size=2048,
        protocol="JWT RS256",
        usage="Identity Token Authentication",
        data_sensitivity="HIGH",
        data_lifetime_years=1,
        pqc_ready=False,
        quantum_risk_level="HIGH",
        recommendation="URGENT: Migrate to ML-DSA (Dilithium, FIPS 204) or Ed25519 hybrid.",
        migration_status="IN_PROGRESS",
        nist_standard="FIPS 204 (ML-DSA Target)"
    )
    c3 = CryptographicAsset(
        asset_name="Ledger Transaction Hash Engine",
        algorithm="SHA-3 / SHA-256",
        key_size=256,
        protocol="Internal Hashing",
        usage="Tamper-proof Ledger Verification",
        data_sensitivity="CRITICAL",
        data_lifetime_years=25,
        pqc_ready=True,
        quantum_risk_level="LOW",
        recommendation="SHA-256/384 provides 128+ bits quantum collision security against Grover's algorithm.",
        migration_status="COMPLETED",
        nist_standard="NIST SP 800-107"
    )
    c4 = CryptographicAsset(
        asset_name="Legacy Inter-Bank Wire Gateway",
        algorithm="RSA-4096",
        key_size=4096,
        protocol="TLS 1.2",
        usage="High-Value SWIFT Wire Messaging",
        data_sensitivity="CRITICAL",
        data_lifetime_years=20,
        pqc_ready=False,
        quantum_risk_level="CRITICAL",
        recommendation="Vulnerable to Harvest-Now-Decrypt-Later (HNDL). Prioritize ML-KEM migration.",
        migration_status="NOT_STARTED",
        nist_standard="FIPS 203 (ML-KEM Target)"
    )
    db.add_all([c1, c2, c3, c4])

    # 8. Synthetic Threat Intelligence Feeds
    t1 = ThreatIntelligence(
        indicator="92.43.11.88",
        indicator_type="IP",
        source="Synthetic Tor Threat Feed",
        severity="HIGH",
        confidence=95,
        description="Known anonymization VPN/Tor exit node linked to automated brute-force attacks.",
        tags=["TOR", "VPN", "ATO", "SYNTHETIC"]
    )
    t2 = ThreatIntelligence(
        indicator="cayman.wire@offshore",
        indicator_type="DOMAIN",
        source="Synthetic Mule Registry",
        severity="CRITICAL",
        confidence=98,
        description="High-risk offshore shell entity identified in international wire fraud simulation.",
        tags=["OFFSHORE", "MULE", "WIRE_FRAUD", "SYNTHETIC"]
    )
    t3 = ThreatIntelligence(
        indicator="185.220.101.5",
        indicator_type="IP",
        source="Synthetic Tor Node List",
        severity="HIGH",
        confidence=90,
        description="German datacenter Tor exit node exhibiting scanning activities.",
        tags=["TOR", "DATACENTER", "SYNTHETIC"]
    )
    db.add_all([t1, t2, t3])

    # 9. Historical Transactions
    now = datetime.utcnow()
    tx1 = Transaction(
        transaction_id_str="TXN-A1091",
        user_id=customer.id,
        amount=1450.0,
        currency="INR",
        merchant="Swiggy Online Food",
        merchant_category="DINING",
        transaction_type="UPI_TRANSFER",
        payment_method="UPI",
        device_id="DEVICE-001",
        session_id="SES-1024",
        location="Chennai, IN [SYNTHETIC]",
        ip_address="192.168.1.104",
        ip_type="PRIVATE",
        status="ALLOW",
        risk_score=7,
        agent_scores={"fraud": 6, "cyber": 4, "behavior": 5, "device": 5, "geo": 2, "beneficiary": 4, "ip": 4, "session": 5, "biometrics": 4, "quantum": 5},
        xai_factors=[{"agent": "device", "contribution": 0.5, "severity": "LOW"}, {"agent": "fraud", "contribution": 1.5, "severity": "LOW"}],
        reasons=["Normal routine spend on verified home Wi-Fi.", "Recognized primary device (Pixel 8)."],
        ledger_debited=True,
        completed_at=now - timedelta(days=2),
        created_at=now - timedelta(days=2)
    )
    tx2 = Transaction(
        transaction_id_str="TXN-A1092",
        user_id=customer.id,
        amount=4200.0,
        currency="INR",
        merchant="Amazon India",
        merchant_category="SHOPPING",
        transaction_type="UPI_TRANSFER",
        payment_method="UPI",
        device_id="DEVICE-001",
        session_id="SES-1024",
        location="Chennai, IN [SYNTHETIC]",
        ip_address="192.168.1.104",
        ip_type="PRIVATE",
        status="ALLOW",
        risk_score=12,
        agent_scores={"fraud": 10, "cyber": 4, "behavior": 8, "device": 5, "geo": 2, "beneficiary": 5, "ip": 4, "session": 5, "biometrics": 4, "quantum": 5},
        xai_factors=[{"agent": "fraud", "contribution": 2.5, "severity": "LOW"}],
        reasons=["Verified e-commerce retailer.", "Amount within normal spending bounds."],
        ledger_debited=True,
        completed_at=now - timedelta(days=1),
        created_at=now - timedelta(days=1)
    )
    db.add_all([tx1, tx2])

    # 10. Audit Log Initial Entry
    log = AuditLog(
        actor_name="SYSTEM",
        actor_role="SYSTEM",
        action="DATABASE_BOOTSTRAPPED",
        resource_type="SYSTEM",
        description="NexGuard Secure Wallet database bootstrapped with demo customer, analyst, 10 agents, and PQC assets.",
        created_at=now
    )
    db.add(log)

    db.commit()
    ensure_peer_users(db)
    print("[Bootstrap] Successfully initialized database with INR 1,25,000 balance, devices, PQC assets, and threat feeds.")


def ensure_peer_users(db: Session):
    """Seed or update peer users for multi-user wallet-to-wallet database transfers."""
    peers = [
        {
            "username": "priya",
            "full_name": "Priya Sharma",
            "email": "priya.sharma@nexguard.bank",
            "phone_number": "+91 98765 11111",
            "upi_id": "priya@nexguard",
            "balance": 45000.0,
            "role": "CUSTOMER"
        },
        {
            "username": "aarav",
            "full_name": "Aarav Sharma",
            "email": "aarav.sharma@nexguard.bank",
            "phone_number": "+91 98765 22222",
            "upi_id": "aarav@nexguard",
            "balance": 28500.0,
            "role": "CUSTOMER"
        },
        {
            "username": "rahul",
            "full_name": "Rahul Verma",
            "email": "rahul.verma@nexguard.bank",
            "phone_number": "+91 98765 33333",
            "upi_id": "rahul@nexguard",
            "balance": 32000.0,
            "role": "CUSTOMER"
        },
        {
            "username": "ananya",
            "full_name": "Ananya Iyer",
            "email": "ananya.iyer@nexguard.bank",
            "phone_number": "+91 98765 44444",
            "upi_id": "ananya@nexguard",
            "balance": 52000.0,
            "role": "CUSTOMER"
        },
        {
            "username": "swiggy",
            "full_name": "Swiggy Online Food",
            "email": "merchant@swiggy.in",
            "phone_number": "+91 98111 22233",
            "upi_id": "swiggy@icici",
            "balance": 185000.0,
            "role": "MERCHANT"
        },
        {
            "username": "globaltech",
            "full_name": "Global Tech Electronics",
            "email": "merchant@globaltech.in",
            "phone_number": "+91 98444 55566",
            "upi_id": "globaltech@hdfc",
            "balance": 340000.0,
            "role": "MERCHANT"
        },
    ]

    updated = False
    for p in peers:
        user = db.query(User).filter(User.username == p["username"]).first()
        if not user:
            user = User(
                username=p["username"],
                email=p["email"],
                full_name=p["full_name"],
                phone_number=p["phone_number"],
                upi_id=p["upi_id"],
                hashed_password=hash_password("demo1234"),
                role=p["role"],
                account_status="ACTIVE",
                is_active=True,
            )
            db.add(user)
            db.flush()

            wallet = Wallet(
                user_id=user.id,
                balance=p["balance"],
                currency="INR",
                status="ACTIVE",
                security_score=92,
                security_status="TRUSTED"
            )
            db.add(wallet)

            ng_bank = NGBankAccount(
                user_id=user.id,
                account_number=f"NG {user.id:04d} {secrets.randbelow(9000)+1000}",
                account_holder=user.full_name,
                bank_name="NG Bank (Simulated)",
                branch_ifsc="NGBK0001024",
                balance=p["balance"] * 2,
                currency="INR",
                status="ACTIVE",
                is_connected=True,
            )
            db.add(ng_bank)

            device = Device(
                user_id=user.id,
                device_id=f"DEVICE-{p['username'].upper()}",
                device_name=f"{p['full_name']}'s Phone",
                device_model="Android / iOS",
                os="Android",
                trust_level="TRUSTED",
                risk_score=8,
                ip_address=f"192.168.1.{120 + user.id}",
                location="Bengaluru, IN [SYNTHETIC]",
                is_active=True
            )
            db.add(device)
            updated = True
        else:
            # Ensure existing user has wallet and upi_id
            if not user.upi_id:
                user.upi_id = p["upi_id"]
                updated = True
            if not user.wallet:
                wallet = Wallet(
                    user_id=user.id,
                    balance=p["balance"],
                    currency="INR",
                    status="ACTIVE",
                    security_score=92,
                    security_status="TRUSTED"
                )
                db.add(wallet)
                updated = True

    if updated:
        db.commit()
        print("[Bootstrap] Peer users & wallets ensured in database.")

