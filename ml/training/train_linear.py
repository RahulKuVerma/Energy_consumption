import os
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.preprocessing.feature_engineering import create_time_series_features, chronological_train_test_split
from ml.models.linear_regression import EnergyLinearRegressionModel
from ml.evaluation.metrics import calculate_all_metrics

def train_linear_regression(
    data_path: Path = REPO_ROOT / "ml" / "data" / "processed" / "processed_energy_data.csv",
    model_save_path: Path = REPO_ROOT / "ml" / "saved_models" / "linear_regression.pkl",
    scaler_save_path: Path = REPO_ROOT / "ml" / "saved_models" / "scaler.pkl"
):
    print("Loading processed dataset...")
    df = pd.read_csv(data_path, parse_dates=["timestamp"], index_col="timestamp")
    
    print("Engineering lag & cyclical features...")
    df_features = create_time_series_features(df, target_col="Global_active_power")
    
    feature_cols = [
        "hour_sin", "hour_cos", "dayofweek_sin", "dayofweek_cos", "is_weekend",
        "lag_1", "lag_2", "lag_3", "lag_24", "lag_168",
        "rolling_mean_6h", "rolling_mean_24h", "rolling_std_24h"
    ]
    # Filter features that exist
    feature_cols = [c for c in feature_cols if c in df_features.columns]
    
    train_df, test_df = chronological_train_test_split(df_features, test_size=0.2)
    
    X_train = train_df[feature_cols].values
    y_train = train_df["Global_active_power"].values
    X_test = test_df[feature_cols].values
    y_test = test_df["Global_active_power"].values
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Fitting regularized Linear Regression (Ridge)...")
    model = EnergyLinearRegressionModel(alpha=10.0)
    model.fit(X_train_scaled, y_train, feature_names=feature_cols)
    
    # Evaluate
    preds = model.predict(X_test_scaled)
    metrics = calculate_all_metrics(y_test, preds)
    print("Linear Regression Test Metrics:", metrics)
    
    # Save artifacts
    model.save(model_save_path)
    joblib.dump(scaler, scaler_save_path)
    print(f"Saved model to {model_save_path} and scaler to {scaler_save_path}")
    return metrics

if __name__ == "__main__":
    train_linear_regression()
