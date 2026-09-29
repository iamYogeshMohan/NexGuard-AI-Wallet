"""
NexGuard Secure Wallet — Demo Scenarios Router
POST /api/demo/scenario/{key}
GET  /api/demo/scenarios
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import TransactionCreate
from ..security import get_optional_user

router = APIRouter(prefix="/api/demo", tags=["Demo Scenarios"])

SCENARIOS = {
    "normal": {
        "label": "Normal Safe Payment",
        "description": "Trusted device (Pixel 8), normal amount, known beneficiary. Expected: LOW RISK → ALLOW.",
        "amount": 2500.0,
        "merchant": "Swiggy Online Food",
        "merchant_category": "DINING",
        "device_id": "DEVICE-001",
        "session_id": "SES-1024",
        "location": "Chennai, IN [SYNTHETIC]",
        "demo_ip": "192.168.1.104",
        "ip_type": "PRIVATE",
        "biometric_verified": True,
        "biometric_confidence": 0.98,
        "expected_decision": "ALLOW",
        "expected_risk_range": [0, 30],
    },
    "suspicious": {
        "label": "Suspicious High-Value Payment",
        "description": "Trusted device, elevated amount (₹38,000), new merchant category. Expected: MEDIUM RISK → VERIFY.",
        "amount": 38000.0,
        "merchant": "Global Tech Electronics",
        "merchant_category": "ELECTRONICS",
        "device_id": "DEVICE-001",
        "session_id": "SES-1024",
        "location": "Chennai, IN [SYNTHETIC]",
        "demo_ip": "192.168.1.104",
        "ip_type": "PRIVATE",
        "biometric_verified": True,
        "biometric_confidence": 0.90,
        "expected_decision": "VERIFY",
        "expected_risk_range": [31, 60],
    },
    "account-takeover": {
        "label": "Account Takeover (ATO) Cyber Attack",
        "description": "Rogue device (Galaxy S24), London VPN IP, impossible travel, Cayman Island offshore wire. Expected: HIGH RISK → BLOCK.",
        "amount": 85000.0,
        "merchant": "Cayman Island Wire Exchange",
        "merchant_category": "WIRE",
        "device_id": "DEVICE-002",
        "session_id": "SES-8821",
        "location": "London, UK [SYNTHETIC — DEMO SCENARIO]",
        "demo_ip": "92.43.11.88",
        "ip_type": "VPN",
        "biometric_verified": False,
        "biometric_confidence": 0.45,
        "expected_decision": "BLOCK",
        "expected_risk_range": [61, 100],
    },
    "impossible-travel": {
        "label": "Impossible Geo-Velocity",
        "description": "Transaction from London 15 minutes after Chennai transaction — 7,800km in 15 min. Expected: BLOCK.",
        "amount": 12000.0,
        "merchant": "Heathrow Airport Duty Free",
        "merchant_category": "RETAIL",
        "device_id": "DEVICE-002",
        "session_id": "SES-8821",
        "location": "London, UK [SYNTHETIC — DEMO SCENARIO]",
        "demo_ip": "92.43.11.88",
        "ip_type": "PUBLIC",
        "biometric_verified": False,
        "biometric_confidence": 0.60,
        "expected_decision": "BLOCK",
        "expected_risk_range": [70, 100],
    },
    "high-value-fraud": {
        "label": "High-Value Fraud Spike",
        "description": "₹72,000 wire to offshore bullion dealer — 20x above baseline. Expected: BLOCK.",
        "amount": 72000.0,
        "merchant": "Offshore Precious Bullion Exchange",
        "merchant_category": "WIRE",
        "device_id": "DEVICE-001",
        "session_id": "SES-1024",
        "location": "Chennai, IN [SYNTHETIC]",
        "demo_ip": "192.168.1.104",
        "ip_type": "PRIVATE",
        "biometric_verified": True,
        "biometric_confidence": 0.92,
        "expected_decision": "BLOCK",
        "expected_risk_range": [60, 100],
    },
}


@router.get("/scenarios")
def list_scenarios():
    return [
        {
            "key": k,
            "label": v["label"],
            "description": v["description"],
            "expected_decision": v["expected_decision"],
            "expected_risk_range": v["expected_risk_range"],
        }
        for k, v in SCENARIOS.items()
    ]


@router.post("/scenario/{key}")
async def run_demo_scenario(key: str, request: Request, db: Session = Depends(get_db)):
    scenario = SCENARIOS.get(key.lower())
    if not scenario:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {key}. Valid keys: {list(SCENARIOS.keys())}")

    from .transactions import create_transaction
    req = TransactionCreate(
        amount=scenario["amount"],
        merchant=scenario["merchant"],
        merchant_category=scenario["merchant_category"],
        device_id=scenario["device_id"],
        session_id=scenario["session_id"],
        location=scenario["location"],
        demo_ip=scenario["demo_ip"],
        ip_type=scenario["ip_type"],
        biometric_verified=scenario["biometric_verified"],
        biometric_confidence=scenario["biometric_confidence"],
    )

    result = await create_transaction(req, request, db, current_user=None)
    return {
        "scenario_key": key,
        "scenario_label": scenario["label"],
        "scenario_description": scenario["description"],
        "expected_decision": scenario["expected_decision"],
        "actual_decision": result.get("status"),
        "result": result,
    }
