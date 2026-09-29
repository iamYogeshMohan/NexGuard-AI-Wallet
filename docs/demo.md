# 🎬 Demo & Viva Presentation Guide — NexGuard Secure Wallet

This guide outlines the **3 Core Viva Demonstration Scenarios** to present to examiners, evaluators, and interviewers.

---

## 1. Setup Before Presentation

1. **Launch Services:** Run `start.bat` on the host laptop.
2. **Open Windows Side-by-Side:**
   - **Left Half of Screen:** Mobile Wallet (`http://localhost:3000/mobile/dashboard`)
   - **Right Half of Screen:** Bank SOC Command Center (`http://localhost:3000/soc`)

---

## 2. The 3 Core Demonstration Scenarios

### Scenario 1: Routine Safe Payment (`ALLOW`)
- **Premise:** Normal daily activity by legitimate account owner Karthik Nair.
- **Action in Wallet:** Select preset payee **"Swiggy Online Food"** (₹2,500, DINING, Phone A / Pixel 8). Click **Pay** and enter PIN `1234`.
- **Expected Outcome:**
  - **Risk Score:** $\le 30$ (typically 7–12/100).
  - **Decision:** `ALLOW`.
  - **Wallet:** Green receipt displayed; ledger debits ₹2,500; new balance ₹1,22,500.
  - **SOC:** WebSocket live feed logs green `TRANSACTION_ALLOWED` event immediately without page refresh.

### Scenario 2: Suspicious High-Value Spike (`VERIFY` $\rightarrow$ Step-Up Release)
- **Premise:** Elevated amount on new category triggering secondary verification.
- **Action in Wallet:** Select preset payee **"Global Tech Electronics"** (₹38,000, ELECTRONICS, Phone A). Click **Pay** and enter PIN `1234`.
- **Expected Outcome:**
  - **Risk Score:** $31–60$ (typically 45–52/100).
  - **Decision:** `VERIFY` (`PENDING_VERIFICATION`).
  - **Ledger Protection:** Balance is **NOT** debited yet.
  - **Adaptive Step-Up:** Prompt appears: *"Verify with Touch ID / Biometrics"*.
  - **Resolution:** Click **Verify with Touch ID**. The payment is authorized and settled. Ledger updates.

### Scenario 3: Account Takeover Cyber Attack (`BLOCK` $\rightarrow$ SOC Incident)
- **Premise:** Hacker using unregistered Phone B (Samsung S24) via London Tor VPN attempting ₹85,000 offshore wire fraud.
- **Action in Wallet:** Select preset payee **"Cayman Island Wire Exchange"** (₹85,000, WIRE, Phone B / S24). Click **Pay** and enter PIN.
- **Expected Outcome:**
  - **Risk Score:** $>60$ (typically 88–95/100).
  - **Decision:** `BLOCK`.
  - **Ledger Protection:** Balance is **NEVER** debited.
  - **XAI Explanation:** Plain-English breakdown displays:
    1. *Unrecognized Hardware DEVICE-002 flagged SUSPICIOUS.*
    2. *Tor VPN exit node detected (92.43.11.88).*
    3. *IMPOSSIBLE_TRAVEL: 7,800 km in 15 min (Chennai $\rightarrow$ London).*
    4. *Offshore mule payee pattern match.*
  - **SOC Action:** Red audio-visual `CRITICAL_ALERT` banner flashes on the SOC dashboard. Incident ticket `INC-0001` is dispatched.
  - **Human-in-the-Loop:** Analyst can review evidence, click **Analyst Override**, select `KEEP_BLOCKED` or `APPROVE_OVERRIDE`, provide mandatory justification, and record an immutable audit entry.

---

## 3. High-Scoring Viva Answers

- **Q: Why multi-agent instead of a single monolithic ML model?**  
  *A: A single model is a black-box that cannot explain jurisdictional risk or verify TLS post-quantum readiness. Multi-agent architecture provides specialized domain evaluation, transparent XAI factor attribution, and fault tolerance.*

- **Q: How does the system handle impossible travel?**  
  *A: The Geo-Velocity Agent uses the spherical Haversine formula on synthetic coordinates to determine great-circle distance. When implied speed exceeds commercial air travel (>800 km/h), it immediately flags IMPOSSIBLE_TRAVEL.*

- **Q: Does this project connect to real banks or store real fingerprints?**  
  *A: No. It operates in an ethical sandbox with simulated UPI settlement and touch confidence metrics, ensuring zero risk of real credential or biometric leakage.*
