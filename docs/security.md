# 🛡️ Security Architecture & Ethics — NexGuard Secure Wallet

---

## 1. Ethical & Safe Demonstration Boundaries

NexGuard Secure Wallet is built strictly for cybersecurity and AI research demonstration:
1. **Simulated Payments Only:** No real bank accounts, real card numbers, or live payment gateways are connected.
2. **Simulated Biometrics Only:** No actual biometric data (fingerprint scans, facial geometry, retina maps) is collected, transmitted, or stored. Sensor telemetry uses synthetic confidence scores (0.0 to 1.0) and simulated Touch ID prompts.
3. **Synthetic Locations & IPs:** Geolocation uses synthetic coordinate tuples (`SYNTHETIC_LOCATIONS`). No invasive device scanning or live GPS tracking is performed.
4. **RFC 1918 Private IP Respect:** Local network IP addresses (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) are recognized as private LAN subnets and are **never** falsely geolocated to external cities.

---

## 2. Authentication & Role-Based Access Control (RBAC)

NexGuard implements stateless JSON Web Tokens (JWT) signed with HMAC-SHA256:

| Role | Permissions |
| :--- | :--- |
| **CUSTOMER** (`karthik`) | Send money, view personal transaction history, manage paired devices, view personal security score. |
| **ANALYST** (`analyst`) | Access SOC console, view all customer telemetry, resolve incidents, execute human overrides, quarantine devices. |
| **ADMIN** | Full administrative access, modify security policy thresholds, configure agent weights. |

---

## 3. Human-in-the-Loop Analyst Override Protocol

NexGuard upholds the principle that **AI recommends, but humans retain ultimate authority**:
1. When a transaction is blocked by autonomous agents, an incident ticket (`INC-XXXX`) is auto-generated.
2. An authorized SOC analyst can review the forensic evidence and execute an **Analyst Override**:
   - `KEEP_BLOCKED:` Confirms malicious attack and reinforces the block.
   - `APPROVE_OVERRIDE:` Marks the incident as a false positive and approves remediation.
3. **Mandatory Justification:** The system strictly rejects any override submitted without an explanatory justification.
4. **Audit Immutability:** The original AI decision is **never deleted**. Both the initial AI risk assessment and the analyst's override action are permanently written to `audit_logs`.

---

## 4. NIST Post-Quantum Cryptography (PQC) Standards

NexGuard monitors cryptographic assets against NIST's finalized 2024 standards:
- **NIST FIPS 203:** ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism / Kyber)
- **NIST FIPS 204:** ML-DSA (Module-Lattice-Based Digital Signature Algorithm / Dilithium)
- **NIST FIPS 205:** SLH-DSA (Stateless Hash-Based Digital Signature Algorithm / SPHINCS+)

Legacy RSA-2048/4096 and ECC algorithms are classified as vulnerable to Harvest-Now-Decrypt-Later (HNDL) attacks and flagged with actionable migration guidance.
