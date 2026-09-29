# 🏛️ System Architecture — NexGuard Secure Wallet

> **Full Title:** *NexGuard Secure Wallet — An AI-Powered Secure Digital Payment Platform with Autonomous Multi-Agent Fraud Detection and Real-Time Security Operations Center*  
> **Tagline:** *"Connect the dots before the threat becomes a loss."*

---

## 1. Two-Phase Architecture Overview

NexGuard Secure Wallet is a dual-perspective intelligent payment and security ecosystem. It bridges the consumer payment experience with enterprise cybersecurity monitoring.

```
                   NEXGUARD SECURE WALLET
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
       PHASE 1                        PHASE 2
   CUSTOMER WALLET                 SECURITY PLATFORM
 (Next.js / Mobile)              (FastAPI / Bank SOC)
             │                             │
             ▼                             │
       User Action                         │
             │                             │
             ▼                             │
       Transaction ────────────────────────┤
                                           ▼
                                    API Gateway
                                           │
                                           ▼
                                  Telemetry Engine
                                           │
                                           ▼
                                  10 AI SECURITY
                                      AGENTS
                                           │
                                           ▼
                                  Risk Orchestrator
                                           │
                                           ▼
                                    XAI ENGINE
                                           │
                                           ▼
                                  DECISION ENGINE
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                           ALLOW        VERIFY        BLOCK
                              │            │            │
                              │            │            ▼
                              │            │         INCIDENT
                              │            │            │
                              └────────────┼────────────┘
                                           │
                                           ▼
                                    SIMULATED LEDGER
                                           │
                                           ▼
                                      PostgreSQL / SQLite
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                          WebSocket                 Audit Log
                          (/ws/soc)             (Tamper-Evident)
                              │
                              ▼
                         BANK SOC
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
            Monitor       Investigate      Respond
```

---

## 2. Core Philosophy: Cross-Domain Security Correlation

Traditional payment platforms evaluate payments in silos: checking only the transaction amount or checking only basic card velocity.

NexGuard correlates across **10 simultaneous security dimensions**:
1. **User Identity & Role:** Authentication history, failed login attempts.
2. **Device Hardware Fingerprint:** Device ID, OS version, root/debugger detection.
3. **Session Context:** Token lifetime, concurrent active sessions, token replay.
4. **Network Telemetry:** LAN vs Public IP, RFC 1918 recognition, Tor/VPN exit node detection.
5. **Geo-Velocity:** Haversine great-circle calculation, speed vs time delta, impossible travel.
6. **Digital Twin Behavior:** Baseline spending mean & variance, cadence, active hours.
7. **Beneficiary Risk:** Mule account markers, offshore keywords, transaction velocity.
8. **Biometrics (Simulated):** Touch confidence, sensor signature binding.
9. **Transaction Details:** Amount Z-score, merchant category risk.
10. **Post-Quantum Readiness:** NIST PQC FIPS 203 ML-KEM/Kyber-1024 audit.

---

## 3. Sub-200ms Decision Flow

1. **Pre-Flight Telemetry:** Wallet collects client time, simulated GPS, hardware ID, touch confidence.
2. **API Ingestion:** Fast API gateway validates schema and checks idempotency key.
3. **Parallel Multi-Agent Execution:** 10 agents execute concurrently. Individual failures are isolated with graceful fallback defaults.
4. **Weighted Risk Aggregation:** Weighted sum normalized to 0–100.
5. **Explainable AI (XAI):** Generates factor contribution breakdown (SHAP-aligned).
6. **Tri-State Execution:**
   - `0–30 ALLOW:` Instant ledger debit, green receipt.
   - `31–60 VERIFY:` Funds held in escrow; adaptive step-up challenge issued.
   - `61–100 BLOCK:` Payment rejected, zero ledger impact, incident `INC-XXXX` auto-created, SOC notified in real-time.
7. **Dual-Channel WebSocket Broadcast:** `/ws/soc` updates SOC console without refresh; `/ws/mobile/{device_id}` updates customer phone.
