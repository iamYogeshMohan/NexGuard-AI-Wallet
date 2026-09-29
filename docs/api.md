# 📡 REST API Reference — NexGuard Secure Wallet

Base URL: `http://localhost:8000/api`  
Swagger UI: `http://localhost:8000/docs`  
ReDoc: `http://localhost:8000/redoc`

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "username": "karthik",
    "password": "nexguard2024"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_id": 1,
    "username": "karthik",
    "full_name": "Karthik Nair",
    "role": "CUSTOMER"
  }
  ```

### `POST /api/auth/register`
- **Request Body:** `username`, `email`, `full_name`, `password`, `phone_number`.
- Creates new user, wallet (₹50,000 balance), and Digital Twin profile.

---

## 2. Transactions (`/api/transactions`)

### `POST /api/transactions`
Creates a transaction, evaluates it across 10 AI security agents, updates the ledger, and returns decision with XAI factor breakdown.
- **Request Body:**
  ```json
  {
    "amount": 2500.0,
    "currency": "INR",
    "merchant": "Swiggy Online Food",
    "merchant_category": "DINING",
    "device_id": "DEVICE-001",
    "session_id": "SES-1024",
    "location": "Chennai, IN [SYNTHETIC]",
    "demo_ip": "192.168.1.104",
    "ip_type": "PRIVATE",
    "biometric_verified": true,
    "biometric_confidence": 0.98,
    "idempotency_key": "optional-uuid-string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "id": 14,
    "transaction_id_str": "TXN-7E91C",
    "amount": 2500.0,
    "merchant": "Swiggy Online Food",
    "status": "ALLOW",
    "risk_score": 8,
    "agent_scores": { "fraud": 8, "cyber": 5, "geo": 4, "device": 6, ... },
    "xai_factors": [ ... ],
    "reasons": [ "Recognized primary device", "Subnet 192.168.1.x is verified local LAN" ],
    "remaining_balance": 122500.0,
    "execution_time_ms": 112.4
  }
  ```

### `POST /api/transactions/{id}/verify-step-up`
Releases a pending `VERIFY` transaction upon secondary biometric / OTP challenge.
- **Request Body:**
  ```json
  {
    "verification_type": "BIOMETRIC",
    "otp_code": "123456"
  }
  ```

---

## 3. Incident Management & Overrides (`/api/incidents`)

### `GET /api/incidents`
Lists all incident tickets. Filterable by `?status=OPEN` and `?severity=CRITICAL`.

### `POST /api/incidents/{incident_id}/override`
Allows an authorized SOC analyst to confirm a block or approve an override.
- **Request Body:**
  ```json
  {
    "action": "APPROVE_OVERRIDE",
    "reason": "Customer called via verified bank branch helpline to confirm wire transfer."
  }
  ```

---

## 4. Device Management (`/api/devices`)

### `POST /api/devices/{device_id}/quarantine`
Quarantines a suspicious device, blocking it from future transactions.

### `POST /api/devices/{device_id}/restore`
Restores a quarantined device to `TRUSTED` status.

### `POST /api/devices/pair/generate`
Generates a 6-digit single-use pairing code (expires in 300s).

---

## 5. Security Operations (`/api/...`)

- `GET /api/dashboard`: High-level SOC KPIs (transactions, incidents, devices, avg risk).
- `GET /api/agents`: Health, weights, and mathematical methods of all 10 agents.
- `GET /api/threat-intelligence`: Active synthetic indicators of compromise (IOCs).
- `GET /api/quantum-risk`: NIST PQC compliance audit and HNDL vulnerability inventory.
- `GET /api/audit-logs`: Immutable security audit log stream.
- `POST /api/copilot`: Natural language AI security assistant query.
- `GET /api/health`: System health (API, DB, AI Engine, WebSocket, Version).
