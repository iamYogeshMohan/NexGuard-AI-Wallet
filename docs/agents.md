# 🤖 10 Autonomous AI Security Agents — NexGuard Secure Wallet

Each agent operates as an independent evaluation module. Non-critical agent errors are gracefully caught and return fallback scores without crashing the transaction pipeline.

---

## 1. Configurable Multi-Agent Weight Distribution

| Agent | Domain | Weight | Method |
| :--- | :--- | :---: | :--- |
| **Agent 1: Fraud Detection** | Transaction Volume & Baseline | **25%** | Z-score anomaly + Isolation Forest + Category multipliers |
| **Agent 2: Cyber Threat** | Device Security Telemetry | **15%** | Root/debugger detection, failed login counter, Tor/VPN |
| **Agent 3: Behavior Agent** | Digital Twin Behavioral Baseline | **15%** | Multi-dimensional deviation (amount, hours, category) |
| **Agent 4: Biometric Security** | Simulated Biometric Confidence | **5%** | Touch confidence fusion + hardware binding check |
| **Agent 5: Device Intelligence** | Hardware Trust State Machine | **10%** | Device trust status (`TRUSTED`, `NEW`, `SUSPICIOUS`, `BLOCKED`) |
| **Agent 6: Geo-Velocity** | Physical Travel Feasibility | **10%** | **Haversine Formula** distance / time delta speed check |
| **Agent 7: Beneficiary Risk** | Payee Trust & Mule Patterns | **5%** | Offshore keyword detection + trust history scoring |
| **Agent 8: IP Intelligence** | Subnet & IP Routing Reputation | **5%** | RFC 1918 private vs Tor/VPN exit node lookup |
| **Agent 9: Session Risk** | Token Integrity & Concurrency | **5%** | Concurrent session detection, token replay checks |
| **Agent 10: Quantum Risk Advisor**| NIST PQC Cryptography Audit | **5%** | FIPS 203/204/205 algorithmic vulnerability catalog |
| **TOTAL** | | **100%** | **Composite Risk Score (0–100)** |

---

## 2. Agent Deep-Dive & Mathematical Formulations

### Agent 1 — Fraud Detection Agent (25%)
- **Formula:**
  $$\text{Z} = \frac{\text{Amount} - \mu_{\text{baseline}}}{\sigma_{\text{baseline}}}$$
- Evaluates statistical distance from the customer's legitimate spending baseline.
- If $Z > 4.0\sigma$, score spikes to 95/100.
- High-risk categories (`WIRE`, `CRYPTO`, `OFFSHORE`) add $+22$ penalty points.

### Agent 6 — Geo-Velocity Agent (10%)
- **Haversine Formula:**
  $$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
  $$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
  $$d = R \cdot c \quad (R = 6371\text{ km})$$
  $$\text{Speed} = \frac{d}{\Delta t_{\text{hours}}}$$
- If implied travel speed exceeds **800 km/h**, flags `IMPOSSIBLE_TRAVEL` (e.g., Chennai $\rightarrow$ London in 15 minutes is $31,200\text{ km/h}$).

### Agent 10 — Quantum Risk Advisor (5%)
- **Objective:** Post-Quantum Cryptography Risk Assessment under NIST FIPS 203 (ML-KEM / Kyber-1024), FIPS 204 (ML-DSA / Dilithium), and FIPS 205 (SLH-DSA / SPHINCS+).
- Evaluates Harvest-Now-Decrypt-Later (HNDL) risk on financial wire messaging.
- Clear disclaimer: *Assesses algorithmic readiness, NOT quantum attack detection.*

---

## 3. Composite Risk Calculation & Tri-State Decision Engine

$$\text{Composite Risk} = \sum_{i=1}^{10} \left( \text{Agent Score}_i \times \text{Weight}_i \right)$$

| Score Range | Decision | Action Taken |
| :---: | :---: | :--- |
| **0 – 30** | `ALLOW` | Instant synthetic payment settlement, ledger debited, green receipt. |
| **31 – 60** | `VERIFY` | Payment held in escrow; adaptive step-up challenge (simulated Touch ID / OTP). |
| **61 – 100** | `BLOCK` | Payment rejected; incident `INC-XXXX` auto-created; SOC alerted in real-time. |
