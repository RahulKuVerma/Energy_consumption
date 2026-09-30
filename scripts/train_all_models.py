import sys
from pathlib import Path
import json

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.training.train_linear import train_linear_regression
from ml.training.train_xgboost import train_xgboost
from ml.training.train_lstm import train_lstm
from backend.app.core.database import get_db_connection

def train_and_register_all():
    print("==================================================")
    print("STEP 1: Training Linear Regression (Baseline)...")
    print("==================================================")
    lr_metrics = train_linear_regression()

    print("\n==================================================")
    print("STEP 2: Training XGBoost Regressor (Tree-based)...")
    print("==================================================")
    xgb_metrics = train_xgboost()

    print("\n==================================================")
    print("STEP 3: Training Deep Recurrent LSTM Network...")
    print("==================================================")
    lstm_metrics = train_lstm()

    print("\n==================================================")
    print("STEP 4: Updating Database Model Registry...")
    print("==================================================")
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Update Linear Regression
        cursor.execute(
            """
            UPDATE ml_models
            SET mae = ?, rmse = ?, mape = ?, r2_score = ?, trained_at = CURRENT_TIMESTAMP
            WHERE model_type = 'linear_regression'
            """,
            (lr_metrics["mae"], lr_metrics["rmse"], lr_metrics["mape"], lr_metrics["r2_score"])
        )
        
        # Update XGBoost
        cursor.execute(
            """
            UPDATE ml_models
            SET mae = ?, rmse = ?, mape = ?, r2_score = ?, trained_at = CURRENT_TIMESTAMP
            WHERE model_type = 'xgboost'
            """,
            (xgb_metrics["mae"], xgb_metrics["rmse"], xgb_metrics["mape"], xgb_metrics["r2_score"])
        )

        # Update LSTM
        cursor.execute(
            """
            UPDATE ml_models
            SET mae = ?, rmse = ?, mape = ?, r2_score = ?, trained_at = CURRENT_TIMESTAMP
            WHERE model_type = 'lstm'
            """,
            (lstm_metrics["mae"], lstm_metrics["rmse"], lstm_metrics["mape"], lstm_metrics["r2_score"])
        )

    print("\nTraining complete! Summary Comparison:")
    print(f"1. Linear Regression -> MAE: {lr_metrics['mae']:.3f} kW | RMSE: {lr_metrics['rmse']:.3f} kW | MAPE: {lr_metrics['mape']:.1f}% | R²: {lr_metrics['r2_score']:.3f}")
    print(f"2. XGBoost           -> MAE: {xgb_metrics['mae']:.3f} kW | RMSE: {xgb_metrics['rmse']:.3f} kW | MAPE: {xgb_metrics['mape']:.1f}% | R²: {xgb_metrics['r2_score']:.3f}")
    print(f"3. Deep LSTM         -> MAE: {lstm_metrics['mae']:.3f} kW | RMSE: {lstm_metrics['rmse']:.3f} kW | MAPE: {lstm_metrics['mape']:.1f}% | R²: {lstm_metrics['r2_score']:.3f}")

if __name__ == "__main__":
    train_and_register_all()
