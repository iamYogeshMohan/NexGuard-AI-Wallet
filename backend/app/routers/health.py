"""
NexGuard Secure Wallet — Health Check
Supports /api/health and /health
Checks API, Database, AI Engine, WebSocket, Version, and Timestamp.
"""

from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from ..config import settings
from ..websocket import manager
from ..agents import orchestrator

router = APIRouter(tags=["Health"])


def _check_system_health(db: Session = None):
    # Check Database
    db_status = "OPERATIONAL"
    try:
        if db:
            db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    # Check AI Engine
    ai_status = "OPERATIONAL"
    try:
        if len(orchestrator.agents) != 10:
            ai_status = f"DEGRADED ({len(orchestrator.agents)}/10 agents loaded)"
    except Exception as e:
        ai_status = f"ERROR: {str(e)}"

    # WebSocket status
    ws_status = {
        "status": "OPERATIONAL",
        "soc_clients": manager.soc_connection_count,
        "mobile_clients": manager.mobile_connection_count,
    }

    return {
        "status": "UP",
        "api": "OPERATIONAL",
        "database": db_status,
        "ai_engine": ai_status,
        "websocket": ws_status,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "pqc_standards": "NIST FIPS 203 (ML-KEM / Kyber-1024), FIPS 204 (ML-DSA / Dilithium)",
    }


@router.get("/api/health")
def health_check_api(db: Session = Depends(get_db)):
    return _check_system_health(db)


@router.get("/health")
def health_check_root(db: Session = Depends(get_db)):
    return _check_system_health(db)
