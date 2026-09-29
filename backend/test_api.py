from app.database import SessionLocal
from app.models import User, Wallet, Device, Transaction, Incident
from app.agents import orchestrator
from app.schemas import TransactionCreate
from app.routers.transactions import create_transaction
import asyncio

async def test_direct():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "c1024").first()
        print(f"Verified User: {user.full_name} | UPI: {user.upi_id}")
        wallet = user.wallet
        print(f"Verified Wallet Balance: INR {wallet.balance} | Trust Score: {wallet.security_score}/100")

        # Test 1: Phone A Routine Transfer
        print("\n--- TEST 1: Phone A (Trusted Pixel 8) ---")
        req1 = TransactionCreate(
            amount=2500.0,
            currency="INR",
            merchant="Swiggy",
            merchant_category="DINING",
            device_id="DEVICE-001",
            session_id="SES-1024",
            location="Chennai, IN",
            demo_ip="192.168.1.104"
        )
        res1 = await create_transaction(req1, db)
        print(f"Outcome: {res1['status']} | Risk: {res1['risk_score']}/100 | Remaining Balance: INR {res1['remaining_balance']}")
        assert res1["status"] == "ALLOW", f"Expected ALLOW, got {res1['status']}"

        # Test 2: Ambiguous Step-Up Transfer
        print("\n--- TEST 2: Medium Risk Step-Up Challenge ---")
        req2 = TransactionCreate(
            amount=35000.0,
            currency="INR",
            merchant="Global Tech Imports",
            merchant_category="ELECTRONICS",
            device_id="DEVICE-001",
            session_id="SES-1024",
            location="Chennai, IN",
            demo_ip="192.168.1.104"
        )
        res2 = await create_transaction(req2, db)
        print(f"Outcome: {res2['status']} | Risk: {res2['risk_score']}/100 | Step-Up Token: {res2.get('step_up_token')}")
        assert res2["status"] == "VERIFY", f"Expected VERIFY, got {res2['status']}"

        # Test 3: Attack on Phone B
        print("\n--- TEST 3: Cyber Attack on Phone B (Suspicious S24 / VPN / London) ---")
        req3 = TransactionCreate(
            amount=85000.0,
            currency="INR",
            merchant="Cayman Island Wire Exchange",
            merchant_category="WIRE",
            device_id="DEVICE-002",
            session_id="SES-8821",
            location="London, UK",
            demo_ip="92.43.11.88"
        )
        res3 = await create_transaction(req3, db)
        print(f"Outcome: {res3['status']} | Risk: {res3['risk_score']}/100 | Incident ID: {res3['incident_id']}")
        print(f"Reasons: {res3['reasons']}")
        assert res3["status"] == "BLOCK", f"Expected BLOCK, got {res3['status']}"

        print("\n========================================================")
        print("ALL 3 STAGES (ALLOW / VERIFY / BLOCK) PASSED PERFECTLY!")
        print("========================================================")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_direct())
