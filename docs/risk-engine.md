# NexGuard Risk Engine Architecture

## 1. Overview
The NexGuard Risk Engine is the centralized decision-making core of the platform. It calculates a normalized composite risk score ($0 - 100$) for every payment request by evaluating structured telemetry across **10 autonomous security agents**.

> **Crucial Rule:** The frontend never decides whether a transaction is safe. The backend owns the final security decision.

---

## 2. 10 Security Agents & Configurable Weights

| Security Agent | Category | Default Weight | Key Signals Evaluated |
| :--- | :--- | :---: | :--- |
| **Fraud Detection** | Heuristic / ML | **25%** | High-velocity transfers, amount deviation, known fraudulent merchant patterns |
| **Cyber Threat** | System / Telemetry | **15%** | Rooted/jailbroken device, debugger attached, emulator signature, malware presence |
| **Behavioral Analysis** | Digital Twin | **15%** | Transaction deviation from user's historical spend, unusual operating hours, category anomaly |
| **Device Intelligence** | Hardware Binding | **10%** | Hardware signature, app version, OS integrity, new vs. trusted hardware status |
| **Geo-Velocity** | Telemetry / Haversine | **10%** | Physical impossibility of travel (>800 km/h between sequential transactions) |
| **Biometric Security** | Telemetry | **5%** | TouchID / FaceID match confidence, liveness detection telemetry |
| **Beneficiary Risk** | Reputation | **5%** | Recipient account age, relationship type, offshore mule flags, transfer history |
| **IP Intelligence** | Network | **5%** | VPN, Tor exit node, datacenter proxy, synthetic threat intelligence match |
| **Session Guard** | Context | **5%** | Concurrent active sessions, location mismatch, session token age and freshness |
| **Quantum Risk Advisor** | PQC Cryptography | **5%** | Harvest-Now-Decrypt-Later risk, cipher suite, key length, NIST FIPS 203 readiness |

$$\text{Composite Risk Score} = \sum_{i=1}^{10} (\text{Agent Score}_i \times \text{Weight}_i)$$

---

## 3. Decision Thresholds

| Risk Score Range | Decision | Action & Ledger Effect |
| :---: | :---: | :--- |
| **0 – 30** | **ALLOW** | Transaction cleared immediately. Sender balance debited, receiver credited. |
| **31 – 60** | **VERIFY** | Transaction placed on hold (`PENDING_VERIFICATION`). Step-up OTP or biometric challenge issued. Ledger debited only upon successful verification. |
| **61 – 100** | **BLOCK** | Transaction rejected immediately. Ledger balance remains untouched. Security Incident auto-created (`INC-XXXX`). Device quarantined and alert broadcast via WebSocket. |

---

## 4. Explainable AI (XAI) Output
For transparency without exposing raw chain-of-thought, the Risk Engine generates structured, explainable contributing factors:
- `+18 New Device`
- `+15 High Amount Deviation`
- `+13 New Beneficiary`
- `+12 Suspicious VPN Session`
- `+10 Impossible Geo-Velocity Travel`
