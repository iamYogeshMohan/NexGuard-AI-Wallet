"""
NexGuard Secure Wallet — Application Configuration
Matches Master Build Prompt specification exactly.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Dict, Optional


class Settings(BaseSettings):
    # ─── App Identity ──────────────────────────────────────────────────────────
    APP_NAME: str = "NexGuard Secure Wallet"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"

    # ─── API ───────────────────────────────────────────────────────────────────
    API_V1_PREFIX: str = "/api"

    # ─── Database ──────────────────────────────────────────────────────────────
    # PostgreSQL takes priority. Falls back to local SQLite for easy development.
    DATABASE_URL: str = "sqlite:///./nexguard.db"
    # Example PostgreSQL: postgresql://postgres:password@localhost:5432/nexguard

    # ─── JWT Authentication ────────────────────────────────────────────────────
    SECRET_KEY: str = "nexguard-super-secret-jwt-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ─── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ]
    CORS_ALLOW_ALL: bool = True  # Set False in production

    # ─── Risk Decision Thresholds ──────────────────────────────────────────────
    # Master Build Prompt specification: 0-30 ALLOW, 31-60 VERIFY, 61-100 BLOCK
    RISK_ALLOW_MAX: int = 30
    RISK_VERIFY_MAX: int = 60
    # BLOCK = 61–100 (derived)

    # ─── 10 Multi-Agent Weights — Master Prompt Specification ─────────────────
    # Total must equal 1.0 (100%)
    AGENT_WEIGHTS: Dict[str, float] = {
        "fraud":       0.25,   # 25% — Fraud Detection Agent
        "cyber":       0.15,   # 15% — Cyber Threat Agent
        "behavior":    0.15,   # 15% — Behavior Agent
        "biometrics":  0.05,   #  5% — Biometric Security Agent
        "device":      0.10,   # 10% — Device Intelligence Agent
        "geo":         0.10,   # 10% — Geo-Velocity Agent
        "beneficiary": 0.05,   #  5% — Beneficiary Risk Agent
        "ip":          0.05,   #  5% — IP Intelligence Agent
        "session":     0.05,   #  5% — Session Risk Agent
        "quantum":     0.05,   #  5% — Quantum Risk Advisor
    }

    # ─── Demo Data Configuration ───────────────────────────────────────────────
    DEMO_USER_USERNAME: str = "karthik"
    DEMO_USER_PASSWORD: str = "nexguard2024"
    ANALYST_USERNAME: str = "analyst"
    ANALYST_PASSWORD: str = "socanalyst2024"
    DEMO_BALANCE: float = 1000000.0  # ₹10,00,000 as per Master specification

    # ─── Device Pairing ────────────────────────────────────────────────────────
    PAIRING_CODE_EXPIRY_SECONDS: int = 300  # 5 minutes
    PAIRING_CODE_LENGTH: int = 6

    # ─── Geo-Velocity ──────────────────────────────────────────────────────────
    # Impossible travel threshold: >800 km/h is physically impossible
    GEO_IMPOSSIBLE_SPEED_KMPH: float = 800.0

    # ─── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60

    # ─── ML Model Paths ────────────────────────────────────────────────────────
    ML_MODELS_DIR: str = "../ml/models"
    USE_ML_MODELS: bool = False  # False = use heuristic fallback; True = use trained models

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings = Settings()
