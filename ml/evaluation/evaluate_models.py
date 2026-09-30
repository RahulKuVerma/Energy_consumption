from typing import Dict, Any, List
import numpy as np
import pandas as pd
from ml.evaluation.metrics import calculate_all_metrics

def evaluate_model_performance(
    model_name: str,
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> Dict[str, Any]:
    """
    Evaluates model performance against held-out ground truth data.
    Computes residuals, percentile error distribution, and standard metrics.
    """
    metrics = calculate_all_metrics(y_true, y_pred)
    residuals = y_true - y_pred

    return {
        "model_name": model_name,
        "metrics": metrics,
        "residuals": {
            "mean": round(float(np.mean(residuals)), 4),
            "std": round(float(np.std(residuals)), 4),
            "max_overprediction": round(float(np.min(residuals)), 4),
            "max_underprediction": round(float(np.max(residuals)), 4),
        },
        "sample_size": len(y_true)
    }
