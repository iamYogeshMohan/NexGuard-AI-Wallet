"""
NexGuard Secure Wallet — Synthetic Dataset Generator
Generates realistic normal, suspicious, and fraudulent transactions
with multi-domain security features.
"""

import json
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path


def generate_synthetic_dataset(n_samples: int = 6000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    random.seed(seed)

    rows = []
    baseline_avg = 2800.0
    baseline_std = 1600.0

    for i in range(n_samples):
        # 80% normal, 12% suspicious, 8% clear fraud / account takeover
        prob = np.random.rand()

        if prob < 0.80:
            # ── Normal Transaction ──────────────────────────
            scenario = "NORMAL"
            amount = max(50.0, np.random.normal(loc=baseline_avg, scale=baseline_std))
            z_score = (amount - baseline_avg) / baseline_std
            cat_risk = np.random.choice([0, 1], p=[0.85, 0.15])
            device_trust = np.random.choice([1.0, 0.8], p=[0.90, 0.10])
            failed_logins = np.random.choice([0, 1], p=[0.95, 0.05])
            is_vpn = 0
            is_private = np.random.choice([1, 0], p=[0.85, 0.15])
            geo_speed = max(0.0, np.random.normal(loc=15.0, scale=20.0))
            impossible_travel = 0
            ben_trust = np.random.uniform(75, 100)
            is_new_ben = np.random.choice([0, 1], p=[0.90, 0.10])
            concurrent_sessions = 1
            bio_conf = np.random.uniform(0.90, 0.99)
            hour = np.random.choice(range(9, 23))  # Daytime
            is_off_hours = 0
            label = 0  # ALLOW

        elif prob < 0.92:
            # ── Suspicious Transaction ──────────────────────
            scenario = "SUSPICIOUS"
            amount = np.random.uniform(25000, 50000)
            z_score = (amount - baseline_avg) / baseline_std
            cat_risk = np.random.choice([1, 2], p=[0.60, 0.40])
            device_trust = np.random.choice([0.8, 0.5], p=[0.60, 0.40])
            failed_logins = np.random.choice([1, 2], p=[0.70, 0.30])
            is_vpn = np.random.choice([0, 1], p=[0.80, 0.20])
            is_private = np.random.choice([0, 1], p=[0.60, 0.40])
            geo_speed = np.random.uniform(80, 350)
            impossible_travel = 0
            ben_trust = np.random.uniform(45, 75)
            is_new_ben = np.random.choice([0, 1], p=[0.30, 0.70])
            concurrent_sessions = np.random.choice([1, 2], p=[0.80, 0.20])
            bio_conf = np.random.uniform(0.70, 0.89)
            hour = np.random.choice(range(0, 24))
            is_off_hours = 1 if (hour < 8 or hour > 22) else 0
            label = 1  # VERIFY

        else:
            # ── Account Takeover / Attack ───────────────────
            scenario = "FRAUD"
            amount = np.random.uniform(60000, 150000)
            z_score = (amount - baseline_avg) / baseline_std
            cat_risk = 2  # Wire / Crypto / Offshore
            device_trust = np.random.choice([0.2, 0.0], p=[0.40, 0.60])
            failed_logins = np.random.randint(3, 8)
            is_vpn = 1
            is_private = 0
            geo_speed = np.random.uniform(850, 4500)  # Physically impossible
            impossible_travel = 1
            ben_trust = np.random.uniform(5, 30)
            is_new_ben = 1
            concurrent_sessions = np.random.choice([2, 3, 4], p=[0.3, 0.5, 0.2])
            bio_conf = np.random.uniform(0.10, 0.55)
            hour = np.random.choice([0, 1, 2, 3, 4, 5, 23])  # Off hours
            is_off_hours = 1
            label = 2  # BLOCK

        rows.append({
            "amount": round(amount, 2),
            "z_score": round(z_score, 2),
            "merchant_category_risk": int(cat_risk),
            "device_trust_score": round(device_trust, 2),
            "failed_logins": int(failed_logins),
            "is_vpn_tor": int(is_vpn),
            "is_private_ip": int(is_private),
            "geo_speed_kmph": round(geo_speed, 1),
            "is_impossible_travel": int(impossible_travel),
            "beneficiary_trust_score": round(ben_trust, 1),
            "is_new_beneficiary": int(is_new_ben),
            "concurrent_sessions": int(concurrent_sessions),
            "biometric_confidence": round(bio_conf, 2),
            "hour_of_day": int(hour),
            "is_off_hours": int(is_off_hours),
            "scenario": scenario,
            "label": int(label)  # 0: ALLOW, 1: VERIFY, 2: BLOCK
        })

    df = pd.DataFrame(rows)
    return df


if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "transactions_dataset.csv"

    print(f"Generating synthetic dataset with 6,000 samples...")
    df = generate_synthetic_dataset(6000)
    df.to_csv(out_file, index=False)
    print(f"Dataset saved to {out_file}")
    print(f"Class distribution:\n{df['label'].value_counts(normalize=True)}")
