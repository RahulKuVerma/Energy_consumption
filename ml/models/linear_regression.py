import os
import joblib
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
from sklearn.linear_model import Ridge

class EnergyLinearRegressionModel:
    """
    Interpretable, regularized baseline linear regression model for energy demand.
    Captures linear relationships across autoregressive lags and cyclical time features.
    """
    def __init__(self, alpha: float = 1.0):
        self.alpha = alpha
        self.model = Ridge(alpha=alpha)
        self.feature_names = []
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: Optional[list] = None):
        self.feature_names = feature_names or []
        self.model.fit(X, y)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("Model must be fitted before predict.")
        preds = self.model.predict(X)
        return np.maximum(0.05, preds)  # Energy consumption is strictly non-negative

    def get_feature_coefficients(self) -> Dict[str, float]:
        if not self.is_fitted or not self.feature_names:
            return {}
        return dict(zip(self.feature_names, self.model.coef_))

    def save(self, file_path: Path):
        file_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            "model": self.model,
            "alpha": self.alpha,
            "feature_names": self.feature_names,
            "is_fitted": self.is_fitted
        }, file_path)

    @classmethod
    def load(cls, file_path: Path) -> "EnergyLinearRegressionModel":
        data = joblib.load(file_path)
        instance = cls(alpha=data.get("alpha", 1.0))
        instance.model = data["model"]
        instance.feature_names = data.get("feature_names", [])
        instance.is_fitted = data.get("is_fitted", True)
        return instance
