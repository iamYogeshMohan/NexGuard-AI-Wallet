# 🗄️ Database Architecture — NexGuard Secure Wallet

NexGuard uses SQLAlchemy 2 with PostgreSQL (production / Docker) and SQLite (quick local development).

---

## 1. Entity-Relationship Schema

```mermaid
erDiagram
    USERS ||--o| WALLETS : owns
    USERS ||--o{ DEVICES : registers
    USERS ||--o{ TRANSACTIONS : initiates
    USERS ||--o{ BENEFICIARIES : manages
    USERS ||--o| BEHAVIOR_PROFILES : models
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDIT_LOGS : records
    DEVICES ||--o{ DEVICE_SESSIONS : authenticates
    TRANSACTIONS ||--o| RISK_ASSESSMENTS : evaluates
    TRANSACTIONS ||--o| INCIDENTS : triggers
    INCIDENTS ||--o{ INCIDENT_EVENTS : logs

    USERS {
        int id PK
        string username UK
        string email UK
        string full_name
        string role
        string hashed_password
    }
    WALLETS {
        int id PK
        int user_id FK
        float balance
        int security_score
        string security_status
    }
    DEVICES {
        int id PK
        int user_id FK
        string device_id UK
        string trust_level
        string ip_address
        string ip_type
        int risk_score
    }
    TRANSACTIONS {
        int id PK
        string transaction_id_str UK
        string idempotency_key UK
        float amount
        string merchant
        string status
        int risk_score
        json agent_scores
        json xai_factors
    }
    INCIDENTS {
        int id PK
        string incident_id UK
        string title
        string severity
        string status
        int risk_score
        string analyst_action
    }
    BEHAVIOR_PROFILES {
        int id PK
        int user_id FK
        float avg_transaction_amount
        float std_transaction_amount
        int typical_hours_start
        int typical_hours_end
        json typical_devices
        json typical_categories
    }
```

---

## 2. Table Catalog

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| `users` | Customer & SOC Analyst accounts | `username`, `email`, `role`, `hashed_password` |
| `wallets` | Synthetic balance & security score | `balance`, `security_score`, `security_status` |
| `devices` | Registered phone hardware & trust | `device_id`, `trust_level`, `ip_address`, `risk_score` |
| `device_sessions`| Active sessions & token bindings | `session_token`, `device_id`, `expires_at` |
| `transactions` | Payment ledger & 10-agent scores | `amount`, `status`, `risk_score`, `idempotency_key` |
| `beneficiaries` | Saved payees & mule indicators | `name`, `upi_id`, `trust_score`, `is_flagged` |
| `behavior_profiles` | Digital Twin behavioral baselines | `avg_transaction_amount`, `typical_hours` |
| `risk_assessments`| Detailed risk evaluation audit | `composite_score`, `agent_scores`, `xai_factors` |
| `incidents` | SOC incident tickets (INC-XXXX) | `incident_id`, `severity`, `status`, `analyst_action` |
| `incident_events`| Forensic incident timeline steps | `event_type`, `actor`, `description` |
| `threat_intelligence` | Synthetic IOCs & Tor exit nodes | `indicator`, `indicator_type`, `severity` |
| `notifications` | Real-time push security alerts | `title`, `message`, `notification_type`, `is_read` |
| `audit_logs` | Immutable audit trail | `actor_name`, `action`, `resource_id`, `description` |
| `cryptographic_assets`| NIST PQC asset inventory | `algorithm`, `pqc_ready`, `quantum_risk_level` |
| `security_policies` | Configurable weights & thresholds | `risk_allow_max`, `risk_verify_max`, `agent_weights` |
| `security_events` | Telemetry logs (failed logins) | `event_type`, `severity`, `device_id` |

---

## 3. Data Integrity & Ledger Guarantees

1. **Transaction Idempotency:** The `idempotency_key` column has a unique database index. Submitting an identical payment request twice returns the original result with zero duplicate debit.
2. **Tri-State Ledger Safety:**
   - `ALLOW:` Debits sender in the same atomic database transaction.
   - `VERIFY:` Funds held; ledger remains untouched until step-up biometric verification succeeds.
   - `BLOCK:` No balance change; incident ticket created atomically.
3. **Immutable Audit Trail:** Actions (`LOGIN`, `TRANSACTION_BLOCKED`, `DEVICE_QUARANTINED`, `ANALYST_OVERRIDE`) append to `audit_logs` and are never updated or deleted.
