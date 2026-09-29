"""
NexGuard Secure Wallet — Main Application Entry Point
Autonomous Multi-Agent AI Security Platform & Real-Time SOC Engine
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base, SessionLocal
from .bootstrap import seed_database
from .websocket import manager
from .routers import (
    health, auth, wallet, transactions, devices, incidents, soc, demo, network,
    bank, beneficiaries, accounts, customers, server_ops
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nexguard-secure-wallet")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Booting {settings.APP_NAME} v{settings.APP_VERSION}...")
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Seed default demo data (safe idempotent operation)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    logger.info(f"{settings.APP_NAME} ready. 10 AI Agents loaded. PQC Hybrid Kyber-1024 active.")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    description="An AI-Powered Secure Digital Payment Platform with Autonomous Multi-Agent Fraud Detection and Real-Time Security Operations Center",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# ─── CORS Middleware ──────────────────────────────────────────────────────────
# Allow access from local LAN (laptop IP) and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(transactions.router)
app.include_router(devices.router)
app.include_router(incidents.router)
app.include_router(soc.router)
app.include_router(demo.router)
app.include_router(network.router)
app.include_router(bank.router)
app.include_router(beneficiaries.router)
app.include_router(accounts.router)
app.include_router(customers.router)
app.include_router(server_ops.router)

# ─── Backward Compatibility Aliases without /api prefix ──────────────────────
# Ensures existing frontend components calling /wallet or /transactions continue working seamlessly
app.include_router(wallet.router, prefix="", tags=["Wallet (Compat)"])
app.include_router(transactions.router, prefix="", tags=["Transactions (Compat)"])
app.include_router(devices.router, prefix="", tags=["Devices (Compat)"])
app.include_router(incidents.router, prefix="", tags=["Incidents (Compat)"])
app.include_router(demo.router, prefix="", tags=["Demo (Compat)"])
app.include_router(bank.router, prefix="", tags=["Bank (Compat)"])
app.include_router(beneficiaries.router, prefix="", tags=["Beneficiaries (Compat)"])
app.include_router(accounts.router, prefix="", tags=["Accounts (Compat)"])
app.include_router(customers.router, prefix="", tags=["Customers (Compat)"])


# ─── Real-Time WebSockets ─────────────────────────────────────────────────────

@app.websocket("/ws/soc")
async def websocket_soc(websocket: WebSocket):
    """Real-time event stream for the Bank Security Operations Center."""
    await manager.connect_soc(websocket)
    try:
        while True:
            # Keep-alive receive loop
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text('{"type":"PONG"}')
    except WebSocketDisconnect:
        manager.disconnect_soc(websocket)
    except Exception as e:
        logger.debug(f"SOC WebSocket error: {e}")
        manager.disconnect_soc(websocket)


@app.websocket("/ws/dashboard")
async def websocket_dashboard_compat(websocket: WebSocket):
    """Backward compatibility alias for existing SOC dashboard."""
    await manager.connect_soc(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text('{"type":"PONG"}')
    except WebSocketDisconnect:
        manager.disconnect_soc(websocket)
    except Exception:
        manager.disconnect_soc(websocket)


@app.websocket("/ws/mobile/{device_id}")
async def websocket_mobile(websocket: WebSocket, device_id: str):
    """Real-time push notification channel for customer mobile devices."""
    await manager.connect_mobile(websocket, device_id)
    # Instantly notify SOC / Command Center that mobile device is connected
    try:
        await manager.broadcast_soc({
            "type": "DEVICE_CONNECTED",
            "device_id": device_id,
            "trust_level": "TRUSTED",
        })
    except Exception:
        pass
    try:
        while True:
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text('{"type":"PONG"}')
    except WebSocketDisconnect:
        manager.disconnect_mobile(websocket, device_id)
    except Exception as e:
        logger.debug(f"Mobile WebSocket error: {e}")
        manager.disconnect_mobile(websocket, device_id)


if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 to allow LAN mobile connections (Section 19 of prompt)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
