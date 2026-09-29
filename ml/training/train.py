"""
NexGuard Secure Wallet — ML Training & Evaluation Pipeline
Trains Isolation Forest and XGBoost Classifier on multi-domain telemetry.
Calculates and saves real measured performance metrics without hardcoded numbers.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)
import xgboost as xgb

from ml.datasets.generate_data import generate_synthetic_dataset

FEATURE_COLS = [
    "amount",
    "z_score",
    "merchant_category_risk",
    "device_trust_score",
    "failed_logins",
    "is_vpn_tor",
    "is_private_ip",
    "geo_speed_kmph",
    "is_impossible_travel",
    "beneficiary_trust_score",
    "is_new_beneficiary",
    "concurrent_sessions",
    "biometric_confidence",
    "hour_of_day",
    "is_off_hours",
]

TARGET_COL = "label"  # 0: ALLOW, 1: VERIFY, 2: BLOCK


def run_pipeline():
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "datasets"
    models_dir = base_dir / "models"
    eval_dir = base_dir / "evaluation"

    models_dir.mkdir(parents=True, exist_ok=True)
    eval_dir.mkdir(parents=True, exist_ok=True)

    dataset_path = data_dir / "transactions_dataset.csv"
    if not dataset_path.exists():
        print("Generating dataset...")
        df = generate_synthetic_dataset(6000)
        df.to_csv(dataset_path, index=False)
    else:
        df = pd.read_csv(dataset_path)

    print(f"Loaded dataset: {len(df)} records.")

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── 1. Isolation Forest (Unsupervised Anomaly Model) ───────────────────
    print("\n[1/2] Training Isolation Forest anomaly detector...")
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.10,
        random_state=42,
        n_jobs=-1
    )
    # Fit primarily on normal data
    X_normal = X_train_scaled[y_train == 0]
    iso_forest.fit(X_normal)

    # Evaluate Isolation Forest on test set (flag -1 as anomaly, 1 as normal)
    iso_preds = iso_forest.predict(X_test_scaled)
    # Binary: normal (0) vs anomaly (1 or 2)
    y_test_binary = (y_test > 0).astype(int)
    iso_binary_preds = (iso_preds == -1).astype(int)
    iso_f1 = f1_score(y_test_binary, iso_binary_preds)
    print(f"Isolation Forest Anomaly F1: {iso_f1:.4f}")

    # ── 2. XGBoost Multi-Class Classifier (Supervised Tri-State Decision) ──
    print("\n[2/2] Training XGBoost Multi-Class Classifier (Tri-State: ALLOW/VERIFY/BLOCK)...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="multi:softprob",
        num_class=3,
        random_state=42,
        eval_metric="mlogloss"
    )
    xgb_model.fit(X_train, y_train)

    y_pred = xgb_model.predict(X_test)
    y_prob = xgb_model.predict_proba(X_test)

    # Real Measured Metrics (Master Prompt §42 Rule: "Never invent ML performance numbers")
    acc = accuracy_score(y_test, y_pred)
    prec_macro = precision_score(y_test, y_pred, average="macro")
    prec_weighted = precision_score(y_test, y_pred, average="weighted")
    rec_macro = recall_score(y_test, y_pred, average="macro")
    rec_weighted = recall_score(y_test, y_pred, average="weighted")
    f1_mac = f1_score(y_test, y_pred, average="macro")
    f1_wt = f1_score(y_test, y_pred, average="weighted")
    conf_mat = confusion_matrix(y_test, y_pred).tolist()

    # Feature Importance (SHAP-aligned weights)
    feature_importances = dict(zip(FEATURE_COLS, [round(float(v), 4) for v in xgb_model.feature_importances_]))
    sorted_features = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)

    metrics = {
        "model_name": "NexGuard-XGBoost-TriState",
        "evaluation_timestamp": pd.Timestamp.utcnow().isoformat(),
        "total_test_samples": len(y_test),
        "classes": ["ALLOW", "VERIFY", "BLOCK"],
        "accuracy": round(float(acc), 4),
        "precision_macro": round(float(prec_macro), 4),
        "precision_weighted": round(float(prec_weighted), 4),
        "recall_macro": round(float(rec_macro), 4),
        "recall_weighted": round(float(rec_weighted), 4),
        "f1_score_macro": round(float(f1_mac), 4),
        "f1_score_weighted": round(float(f1_wt), 4),
        "confusion_matrix": conf_mat,
        "isolation_forest_anomaly_f1": round(float(iso_f1), 4),
        "feature_importances": dict(sorted_features),
    }

    print("\n" + "=" * 55)
    print("      REAL MEASURED MACHINE LEARNING METRICS")
    print("=" * 55)
    print(f"Accuracy:           {acc * 100:.2f}%")
    print(f"Macro Precision:    {prec_macro * 100:.2f}%")
    print(f"Macro Recall:       {rec_macro * 100:.2f}%")
    print(f"Macro F1-Score:     {f1_mac * 100:.2f}%")
    print(f"Confusion Matrix:   {conf_mat}")
    print("\nTop 5 Important Telemetry Features:")
    for feat, imp in sorted_features[:5]:
        print(f"  • {feat:<24}: {imp:.4f}")
    print("=" * 55)

    # ── 3. Save Model Artifacts & Evaluation Report ────────────────────────
    with open(models_dir / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    with open(models_dir / "isolation_forest.pkl", "wb") as f:
        pickle.dump(iso_forest, f)
    xgb_model.save_model(models_dir / "xgboost_model.json")

    metrics_file = eval_dir / "metrics.json"
    with open(metrics_file, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nArtifacts saved successfully:")
    print(f"  - Scaler:           {models_dir / 'scaler.pkl'}")
    print(f"  - Isolation Forest: {models_dir / 'isolation_forest.pkl'}")
    print(f"  - XGBoost Model:    {models_dir / 'xgboost_model.json'}")
    print(f"  - Metrics Report:   {metrics_file}")

    return metrics


if __name__ == "__main__":
    run_pipeline()
