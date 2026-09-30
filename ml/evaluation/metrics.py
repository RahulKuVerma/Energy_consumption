from typing import Dict, Any
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def mean_absolute_percentage_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calculates MAPE avoiding division by zero with small epsilon."""
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    epsilon = 1e-5
    return float(np.mean(np.abs((y_true - y_pred) / (y_true + epsilon))) * 100)

def mean_directional_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calculates MDA: percentage of times the model correctly predicts the direction of change."""
    if len(y_true) < 2:
        return 100.0
    actual_diff = np.diff(y_true)
    pred_diff = np.diff(y_pred)
    return float(np.mean((actual_diff * pred_diff) > 0) * 100)

def calculate_all_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculates comprehensive time-series evaluation metrics."""
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    mape = mean_absolute_percentage_error(y_true, y_pred)
    r2 = float(r2_score(y_true, y_pred))
    mda = mean_directional_accuracy(y_true, y_pred)
    
    # Normalized RMSE by range of target
    y_range = float(np.max(y_true) - np.min(y_true))
    nrmse = (rmse / y_range) if y_range > 0 else 0.0

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "mape": round(mape, 2),
        "r2_score": round(r2, 4),
        "mda_percent": round(mda, 2),
        "nrmse": round(nrmse, 4)
    }
