# ⚡ Real-Time WebSocket Infrastructure — NexGuard Secure Wallet

NexGuard features a low-latency, dual-channel WebSocket engine connecting the customer wallet and the bank SOC console.

---

## 1. WebSocket Endpoints

| Endpoint | Channel | Target Audience | Purpose |
| :--- | :---: | :--- | :--- |
| `/ws/soc` | `SOC` | Security Operations Analysts | Real-time threat stream, critical alert popups, incident updates |
| `/ws/dashboard` | `SOC` | SOC Dashboard (Compat) | Backward compatibility alias |
| `/ws/mobile/{device_id}` | `MOBILE` | Individual Customer Phone | Targeted push notifications (blocked transactions, step-up challenges) |

---

## 2. Event Types & Schemas

### `CRITICAL_ALERT`
Broadcast to SOC when a high-risk transaction ($>60$ risk) is intercepted and blocked:
```json
{
  "type": "CRITICAL_ALERT",
  "timestamp": "2026-09-23T08:50:00.000Z",
  "data": {
    "transaction_id_str": "TXN-8F12C",
    "user": "Karthik Nair",
    "amount": 85000.0,
    "merchant": "Cayman Island Wire Exchange",
    "status": "BLOCK",
    "risk_score": 91,
    "device_id": "DEVICE-002",
    "incident_id": "INC-0001",
    "reasons": [
      "Hardware DEVICE-002 is flagged SUSPICIOUS.",
      "Connection through synthetic Tor exit node (92.43.11.88).",
      "IMPOSSIBLE_TRAVEL: 7,800 km in 15 min."
    ]
  }
}
```

### `STEP_UP_CHALLENGE`
Sent when a medium-risk transaction ($31–60$ risk) requires secondary verification:
```json
{
  "type": "STEP_UP_CHALLENGE",
  "timestamp": "2026-09-23T08:50:00.000Z",
  "data": {
    "transaction_id_str": "TXN-7B29A",
    "amount": 38000.0,
    "merchant": "Global Tech Electronics",
    "status": "PENDING_VERIFICATION",
    "risk_score": 48
  }
}
```

### `TRANSACTION_ALLOWED`
Sent upon successful low-risk settlement ($\le 30$ risk):
```json
{
  "type": "TRANSACTION_ALLOWED",
  "timestamp": "2026-09-23T08:50:00.000Z",
  "data": {
    "transaction_id_str": "TXN-3E10B",
    "amount": 2500.0,
    "merchant": "Swiggy Online Food",
    "status": "ALLOW",
    "risk_score": 8
  }
}
```

---

## 3. Keep-Alive Heartbeat

The WebSocket manager implements a ping-pong heartbeat protocol:
- Client can send string `"PING"`
- Server immediately responds with `{"type":"PONG"}`
- Disconnected sockets are cleanly pruned from the connection pool on send errors.
