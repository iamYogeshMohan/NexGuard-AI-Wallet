# 🛡️ NexGuard Secure Wallet

### *An AI-Powered Secure Digital Payment Platform with Autonomous Multi-Agent Fraud Detection and Real-Time Security Operations Center*

> **Tagline:** *"Connect the dots before the threat becomes a loss."*  
> **Philosophy:** *"Don't build a wallet that simply moves money. Build a wallet that understands whether a transaction should be trusted before moving the money."*

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)](https://nextjs.org/)
[![NIST PQC](https://img.shields.io/badge/NIST%20PQC-FIPS%20203%20ML--KEM-purple.svg)](https://csrc.nist.gov/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📑 Table of Contents

1. [System Architecture](#-system-architecture)
2. [Dual Perspectives: Phase 1 & Phase 2](#-dual-perspectives)
3. [10 Autonomous AI Security Agents](#-10-autonomous-ai-security-agents)
4. [3 Core Viva Demonstration Scenarios](#-3-core-viva-demonstration-scenarios)
5. [Real Measured ML Performance](#-real-measured-ml-performance)
6. [Tech Stack](#-tech-stack)
7. [Repository Structure](#-repository-structure)
8. [Quick Start Guide](#-quick-start-guide)
9. [Multi-Device Local Area Network (LAN) Setup](#-multi-device-lan-setup)
10. [Documentation Suite](#-documentation-suite)

---

## 🏛️ System Architecture

```text
📱 CLIENT PERSPECTIVE (Mobile GPay Simulator)
   • Scan QR / Select Contact / Enter UPI ID
   • Live Dynamic Wallet Security Score (0-100)
   • Pre-Flight Telemetry: Hardware ID, GPS, IP Subnet, Simulated Biometrics
                                │
                                ▼
                     ┌──────────────────────┐
                     │ NEXGUARD API GATEWAY │
                     │   (FastAPI / Py3.11) │
                     └──────────┬───────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │  🤖 10-AGENT PARALLEL SECURITY CORE (<200ms) │
         │                                              │
         │  1. Fraud Agent          (Z-Score & Spike)   │
         │  2. Cyber Threat Agent   (Root & VPN/Tor)    │
         │  3. Behavior Agent       (Digital Twin)      │
         │  4. Biometrics Agent     (Touch Confidence)  │
         │  5. Device Agent         (Hardware Binding)  │
         │  6. Geo-Velocity Agent   (Haversine Distance)│
         │  7. Beneficiary Agent    (Payee Mule Risk)   │
         │  8. IP Intelligence Agent(Subnet & RFC 1918) │
         │  9. Session Risk Agent   (Token Replay Risk) │
         │  10. Quantum Risk Advisor(NIST FIPS 203 PQC) │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
                      WEIGHTED RISK SCORE (0–100)
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
       🟢 ALLOW (0–30)    🟡 VERIFY (31–60)  🔴 BLOCK (61–100)
       Instant Settlement  Step-Up Biometric  Aborted + XAI Alert
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                                ▼
                 ┌─────────────────────────────┐
                 │   BANK SOC COMMAND CENTER   │
                 │ Real-Time WebSocket Alerts  │
                 │ Incident Desk (INC-XXXX)    │
                 │ Analyst Human Remediation   │
                 └─────────────────────────────┘
```

---

## 🎭 Dual Perspectives

### Phase 1: Consumer Mobile Wallet (`/home` & `/mobile/dashboard`)
- **Simulated NG Bank Integration:** Every registered customer is auto-provisioned a simulated NG Bank account (`NG **** XXXX`) with **₹10,00,000 demo starting balance**.
- **Mobile-First Fintech Customer Routes:**
  - `/home`: Dashboard, NG Bank card, available balance, quick actions, recent transactions.
  - `/send`: 5-step flow (Recipient $\rightarrow$ Amount $\rightarrow$ Review $\rightarrow$ AI Security Check $\rightarrow$ ALLOW/VERIFY/BLOCK).
  - `/receive`: Interactive QR code, UPI ID copy, simulated credit (+₹5,000).
  - `/scan`: Simulated viewfinder scanner with pre-configured demo presets.
  - `/add-money`: Top up simulated funds from NG Bank or cards.
  - `/security`: 5-pillar security score breakdown, trusted hardware, active sessions.
  - `/devices`: Hardware authorization, trust statuses (`TRUSTED`, `NEW`, `SUSPICIOUS`, `BLOCKED`).
  - `/beneficiaries`: Manage recipient list with status and risk ratings.
  - `/notifications`: Real-time transaction and security alert stream.
  - `/profile`: Customer information, NG Bank connection status, logout.
  - `/login`, `/register`, `/otp`, `/forgot-password`: Full authentication and 6-digit OTP verification.

### Phase 2: Bank SOC Command Center (`/` & `/soc`)
- Real-time WebSocket event stream (`/ws/soc`).
- Payments oversight: Transactions, Customers, Accounts, Wallets, Beneficiaries.
- Centralized controls: Freeze/Unfreeze/Restrict/Block customer accounts and quarantine rogue devices.
- Priority Incident Queue (`INC-XXXX`) with forensic radar charts and XAI factor attribution.
- **Human-in-the-Loop Analyst Override:** `KEEP_BLOCKED` vs `APPROVE_OVERRIDE` with mandatory justification.
- 10 AI Agents status monitor, Digital Twin profile inspector, and Threat Intelligence registry.
- NIST Post-Quantum Cryptography Risk Assessment (ML-KEM / Kyber-1024).
- Interactive natural-language **AI Security Copilot**.
- Master Live Demo (`/live-demo`): Side-by-side interactive split view.

---

## 🤖 10 Autonomous AI Security Agents

| Agent | Domain | Weight | Method |
| :--- | :--- | :---: | :--- |
| **Fraud Detection** | Amount & Velocity | **25%** | Z-score anomaly + Isolation Forest + Category multipliers |
| **Cyber Threat** | Device Integrity | **15%** | Root/debugger detection, failed login counter, Tor/VPN |
| **Behavior Agent** | Digital Twin Profile | **15%** | Multi-dimensional deviation (spending, hours, categories) |
| **Biometric Security** | Sensor Confidence | **5%** | Simulated touch dynamics + hardware binding fusion |
| **Device Intelligence**| Hardware Lifecycle | **10%** | Device trust state (`TRUSTED`, `NEW`, `SUSPICIOUS`, `BLOCKED`) |
| **Geo-Velocity** | Physical Feasibility| **10%** | **Haversine formula** distance / time delta speed check |
| **Beneficiary Risk** | Payee Profile | **5%** | Offshore keyword detection + trust history scoring |
| **IP Intelligence** | Subnet Reputation | **5%** | RFC 1918 private vs synthetic Tor/VPN exit node lookup |
| **Session Risk** | Token Security | **5%** | Concurrent session detection, token replay checks |
| **Quantum Risk Advisor**| NIST PQC Audit | **5%** | FIPS 203/204/205 algorithmic vulnerability catalog |
| **TOTAL** | | **100%** | **Composite Risk Score (0–100)** |

---

## 🎬 3 Core Viva Demonstration Scenarios

1. **Scenario 1: Routine Safe Payment (`ALLOW`)**
   - *Payee:* Swiggy Online Food • *Amount:* ₹2,500 • *Device:* Phone A (Pixel 8) • *Location:* Chennai
   - *Outcome:* Risk score 8/100 $\rightarrow$ `ALLOW`. Instant ledger debit, green receipt, SOC notified.
2. **Scenario 2: Suspicious High-Value Payment (`VERIFY`)**
   - *Payee:* Global Tech Electronics • *Amount:* ₹38,000 • *Device:* Phone A
   - *Outcome:* Risk score 48/100 $\rightarrow$ `VERIFY`. Balance held; Touch ID step-up challenge prompt appears. Verifying releases payment.
3. **Scenario 3: Account Takeover Cyber Attack (`BLOCK`)**
   - *Payee:* Cayman Island Wire Exchange • *Amount:* ₹85,000 • *Device:* Phone B (Galaxy S24) • *IP:* London Tor VPN
   - *Outcome:* Risk score 91/100 $\rightarrow$ `BLOCK`. Balance never debited. Incident `INC-0001` dispatched to SOC with audio-visual alarm.

---

## 🧠 Real Measured ML Performance

Evaluated on 1,500 held-out test samples (`ml/evaluation/metrics.json`):

| Metric | Measured Score |
| :--- | :---: |
| **Test Accuracy** | **100.00%** |
| **Macro Precision** | **100.00%** |
| **Macro Recall** | **100.00%** |
| **Macro F1-Score** | **100.00%** |
| **Isolation Forest Anomaly F1** | **0.8119** |

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2, Uvicorn, WebSockets.
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Machine Learning:** Scikit-Learn, XGBoost, NumPy, Pandas.
- **Database:** SQLite (default development) / PostgreSQL 16 (Docker production).
- **Security:** Stateless JWT (HS256), Bcrypt password hashing, NIST FIPS 203 ML-KEM/Kyber-1024 hybrid TLS modeling.

---

## 📁 Repository Structure

```text
NexGuard AI Wallet/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point & WebSockets
│   │   ├── config.py          # Config, weights, and thresholds
│   │   ├── models.py          # 16 SQLAlchemy tables
│   │   ├── schemas.py         # Pydantic v2 request/response models
│   │   ├── security.py        # JWT & Bcrypt authentication
│   │   ├── audit.py           # Immutable audit log service
│   │   ├── agents.py          # 10 AI Agents & Orchestrator
│   │   ├── websocket.py       # SOC & Mobile WebSocket manager
│   │   ├── bootstrap.py       # Database seed data
│   │   └── routers/           # Auth, Wallet, Transactions, Devices, Incidents, SOC, Demo
│   ├── tests/
│   │   └── test_system.py     # Automated pytest test suite
│   ├── venv/                  # Local Python virtual environment
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # Portal gateway
│   │   │   ├── mobile/        # Customer Mobile Wallet platform
│   │   │   ├── soc/           # Bank SOC Command Center
│   │   │   ├── demo/          # Attack Simulation Lab
│   │   │   └── ...            # Dedicated SOC subroutes
│   │   └── lib/api.ts         # Dynamic LAN API & WebSocket client
│   └── Dockerfile
├── ml/
│   ├── datasets/              # Synthetic telemetry dataset generator
│   ├── training/              # Isolation Forest & XGBoost training pipeline
│   ├── models/                # Trained model artifacts (.pkl, .json)
│   └── evaluation/            # Measured metrics.json
├── docs/                      # 10 Comprehensive markdown documentation files
├── docker-compose.yml         # Full multi-container stack (Postgres + App)
├── start.bat                  # 1-Click launcher for Windows
└── .env.example               # Environment variables template
```

---

## 🚀 Quick Start Guide

### Option 1: 1-Click Windows Launcher
Double-click `start.bat` in the project root:
- **Mobile Wallet:** [http://localhost:3000/mobile/dashboard](http://localhost:3000/mobile/dashboard)
- **Bank SOC Console:** [http://localhost:3000/soc](http://localhost:3000/soc)
- **Attack Simulation Lab:** [http://localhost:3000/demo](http://localhost:3000/demo)
- **API Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Docker Compose
```powershell
docker-compose up --build -d
```

---

## 🌐 Multi-Device LAN Setup

To test from your physical mobile phone on the same Wi-Fi:
1. Open PowerShell and run `ipconfig` to find your IPv4 Address (e.g. `192.168.1.100`).
2. On your phone's browser, open:
   ```text
   http://192.168.1.100:3000/mobile/dashboard
   ```
3. The frontend automatically connects to the backend running on `192.168.1.100:8000`.

---

## 📚 Documentation Suite

- [🏛️ System Architecture](docs/architecture.md)
- [🗄️ Database Architecture](docs/database.md)
- [🤖 10 AI Agents Reference](docs/agents.md)
- [🧠 Machine Learning Engine](docs/ml.md)
- [🛡️ Security & Ethics](docs/security.md)
- [🌐 Multi-Device Networking](docs/networking.md)
- [⚡ WebSocket Infrastructure](docs/websocket.md)
- [🎬 Demo & Viva Presentation Guide](docs/demo.md)
- [📡 REST API Reference](docs/api.md)
- [🚀 Deployment Guide](docs/deployment.md)

---

## 📄 License & Academic Integrity

Built as an advanced research platform for AI-powered FinTech cybersecurity.  
© 2026 NexGuard Secure Wallet Architecture Team.
