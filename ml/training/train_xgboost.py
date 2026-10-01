import os
import sys
from pathlib import Path
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.preprocessing.feature_engineering import create_time_series_features, chronological_train_test_split
from ml.models.xgboost_model import EnergyXGBoostModel
from ml.evaluation.metrics import calculate_all_metrics

def train_xgboost(
    data_path: Path = REPO_ROOT / "ml" / "data" / "processed" / "processed_energy_data.csv",
    model_save_path: Path = REPO_ROOT / "ml" / "saved_models" / "xgboost_model.json"
):
    print("Loading processed energy dataset...")
    df = pd.read_csv(data_path, parse_dates=["timestamp"], index_col="timestamp")
    
    print("Generating time-series features (cyclical, lags, rolling)...")
    df_features = create_time_series_features(df, target_col="Global_active_power")
    
    feature_cols = [
        "hour_sin", "hour_cos", "dayofweek_sin", "dayofweek_cos", "is_weekend",
        "lag_1", "lag_2", "lag_3", "lag_24", "lag_168",
        "rolling_mean_6h", "rolling_mean_24h", "rolling_std_24h"
    ]
    feature_cols = [c for c in feature_cols if c in df_features.columns]
    
    train_df, test_df = chronological_train_test_split(df_features, test_size=0.2)
    
    X_train = train_df[feature_cols].values
    y_train = train_df["Global_active_power"].values
    X_test = test_df[feature_cols].values
    y_test = test_df["Global_active_power"].values
    
    print(f"Training XGBoost Regressor on {len(X_train)} samples with {len(feature_cols)} features...")
    model = EnergyXGBoostModel(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85
    )
    model.fit(X_train, y_train, feature_names=feature_cols)
    
    preds = model.predict(X_test)
    metrics = calculate_all_metrics(y_test, preds)
    print("XGBoost Test Metrics:", metrics)
    
    # Save model artifact
    model.save(model_save_path)
    print(f"Saved XGBoost model to {model_save_path}")
    
    # Save feature importance
    importances = model.get_feature_importances()
    imp_path = Path(model_save_path).parent / "xgboost_feature_importance.json"
    with open(imp_path, "w") as f:
        json.dump(importances, f, indent=2)
        
    return metrics

if __name__ == "__main__":
    train_xgboost()
