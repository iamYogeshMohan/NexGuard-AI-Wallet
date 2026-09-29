"""
NexGuard Secure Wallet — WebSocket Connection Manager
Supports /ws/soc and /ws/mobile/{device_id} channels.
"""

import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Set
from fastapi import WebSocket

logger = logging.getLogger("nexguard.websocket")


class ConnectionManager:
    """
    Manages WebSocket connections for SOC dashboard and mobile clients.
    Features: heartbeat, authenticated broadcast, per-device channels.
    """

    def __init__(self):
        # SOC connections (many analysts)
        self._soc_connections: Set[WebSocket] = set()
        # Mobile connections keyed by device_id
        self._mobile_connections: Dict[str, Set[WebSocket]] = {}

    # ─── Connection Lifecycle ─────────────────────────────────────────────────

    async def connect_soc(self, websocket: WebSocket):
        await websocket.accept()
        self._soc_connections.add(websocket)
        logger.info(f"SOC client connected. Total SOC connections: {len(self._soc_connections)}")
        # Send welcome heartbeat
        await self._send_safe(websocket, {
            "type": "CONNECTED",
            "channel": "SOC",
            "timestamp": datetime.utcnow().isoformat(),
            "message": "NexGuard SOC WebSocket connected. Real-time event stream active."
        })

    def disconnect_soc(self, websocket: WebSocket):
        self._soc_connections.discard(websocket)
        logger.info(f"SOC client disconnected. Total SOC connections: {len(self._soc_connections)}")

    async def connect_mobile(self, websocket: WebSocket, device_id: str):
        await websocket.accept()
        if device_id not in self._mobile_connections:
            self._mobile_connections[device_id] = set()
        self._mobile_connections[device_id].add(websocket)
        logger.info(f"Mobile device {device_id} connected.")
        await self._send_safe(websocket, {
            "type": "CONNECTED",
            "channel": "MOBILE",
            "device_id": device_id,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "NexGuard Mobile WebSocket connected. Security notifications active."
        })

    def disconnect_mobile(self, websocket: WebSocket, device_id: str):
        if device_id in self._mobile_connections:
            self._mobile_connections[device_id].discard(websocket)
            if not self._mobile_connections[device_id]:
                del self._mobile_connections[device_id]
        logger.info(f"Mobile device {device_id} disconnected.")

    # ─── Messaging ───────────────────────────────────────────────────────────

    async def _send_safe(self, websocket: WebSocket, payload: dict):
        """Send to a single websocket, ignoring send errors."""
        try:
            await websocket.send_text(json.dumps(payload))
        except Exception as e:
            logger.debug(f"WebSocket send error (client likely disconnected): {e}")

    async def broadcast_soc(self, payload: dict):
        """Broadcast an event to all connected SOC clients."""
        if not self._soc_connections:
            return
        payload["timestamp"] = payload.get("timestamp", datetime.utcnow().isoformat())
        disconnected = set()
        for ws in list(self._soc_connections):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self._soc_connections.discard(ws)

    async def broadcast_mobile(self, device_id: str, payload: dict):
        """Send a targeted notification to a specific mobile device."""
        if device_id not in self._mobile_connections:
            return
        payload["timestamp"] = payload.get("timestamp", datetime.utcnow().isoformat())
        disconnected = set()
        for ws in list(self._mobile_connections[device_id]):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self._mobile_connections[device_id].discard(ws)

    async def broadcast(self, payload: dict):
        """Broadcast to ALL channels (SOC + all mobiles). Backward compatible."""
        await self.broadcast_soc(payload)
        for device_id in list(self._mobile_connections.keys()):
            await self.broadcast_mobile(device_id, payload)

    async def send_transaction_event(
        self,
        event_type: str,
        transaction_data: dict,
        device_id: Optional[str] = None
    ):
        """Structured transaction lifecycle event broadcaster."""
        payload = {
            "type": event_type,
            "data": transaction_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        # Always notify SOC
        await self.broadcast_soc(payload)
        # Notify specific mobile device if provided
        if device_id:
            await self.broadcast_mobile(device_id, payload)

    async def heartbeat(self, websocket: WebSocket):
        """Send periodic keep-alive ping."""
        await self._send_safe(websocket, {
            "type": "HEARTBEAT",
            "timestamp": datetime.utcnow().isoformat()
        })

    @property
    def soc_connection_count(self) -> int:
        return len(self._soc_connections)

    @property
    def mobile_connection_count(self) -> int:
        return sum(len(conns) for conns in self._mobile_connections.values())

    @property
    def soc_connections(self) -> Set[WebSocket]:
        return self._soc_connections

    @property
    def mobile_connections(self) -> Dict[str, Set[WebSocket]]:
        return self._mobile_connections

    @property
    def active_connections(self) -> List[WebSocket]:
        mobiles = [ws for s in self._mobile_connections.values() for ws in s]
        return list(self._soc_connections) + mobiles


# ─── Singleton manager ────────────────────────────────────────────────────────
manager = ConnectionManager()


# ─── WebSocket Event Types ────────────────────────────────────────────────────

class WSEvents:
    CONNECTED = "CONNECTED"
    HEARTBEAT = "HEARTBEAT"
    TRANSACTION_CREATED = "TRANSACTION_CREATED"
    ANALYSIS_STARTED = "ANALYSIS_STARTED"
    AGENT_COMPLETED = "AGENT_COMPLETED"
    RISK_CALCULATED = "RISK_CALCULATED"
    TRANSACTION_ALLOWED = "TRANSACTION_ALLOWED"
    VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED"
    TRANSACTION_BLOCKED = "TRANSACTION_BLOCKED"
    INCIDENT_CREATED = "INCIDENT_CREATED"
    INCIDENT_RESOLVED = "INCIDENT_RESOLVED"
    DEVICE_QUARANTINED = "DEVICE_QUARANTINED"
    DEVICE_RESTORED = "DEVICE_RESTORED"
    NOTIFICATION_CREATED = "NOTIFICATION_CREATED"
    CRITICAL_ALERT = "CRITICAL_ALERT"
    STEP_UP_CHALLENGE = "STEP_UP_CHALLENGE"
    STEP_UP_RESOLVED = "STEP_UP_RESOLVED"
    NEW_TRANSACTION = "NEW_TRANSACTION"
    WALLET_DEPOSIT = "WALLET_DEPOSIT"
