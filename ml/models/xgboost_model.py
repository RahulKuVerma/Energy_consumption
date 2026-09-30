import os
from pathlib import Path
from typing import Dict, Any, Optional, List
import numpy as np
import xgboost as xgb

class EnergyXGBoostModel:
    """
    Gradient Boosted Decision Trees (XGBoost) for non-linear energy load forecasting.
    Excels at capturing interaction effects between peak hours, weather, and day of week.
    """
    def __init__(
        self,
        n_estimators: int = 250,
        max_depth: int = 6,
        learning_rate: float = 0.05,
        subsample: float = 0.8,
        colsample_bytree: float = 0.8,
        random_state: int = 42
    ):
        self.params = {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
            "learning_rate": learning_rate,
            "subsample": subsample,
            "colsample_bytree": colsample_bytree,
            "random_state": random_state,
            "objective": "reg:squarederror",
            "eval_metric": "rmse"
        }
        self.model = xgb.XGBRegressor(**self.params)
        self.feature_names: List[str] = []
        self.is_fitted = False

    def fit(
        self, 
        X: np.ndarray, 
        y: np.ndarray, 
        eval_set: Optional[list] = None,
        feature_names: Optional[List[str]] = None
    ):
        self.feature_names = feature_names or []
        self.model.fit(
            X, 
            y, 
            eval_set=eval_set, 
            verbose=False
        )
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("Model must be fitted before predict.")
        preds = self.model.predict(X)
        return np.maximum(0.05, preds)

    def get_feature_importances(self) -> Dict[str, float]:
        if not self.is_fitted:
            return {}
        importances = self.model.feature_importances_
        if self.feature_names and len(self.feature_names) == len(importances):
            return dict(zip(self.feature_names, [float(v) for v in importances]))
        return {f"feat_{i}": float(v) for i, v in enumerate(importances)}

    def save(self, file_path: Path):
        file_path.parent.mkdir(parents=True, exist_ok=True)
        self.model.save_model(str(file_path))

    @classmethod
    def load(cls, file_path: Path) -> "EnergyXGBoostModel":
        instance = cls()
        instance.model.load_model(str(file_path))
        instance.is_fitted = True
        return instance
