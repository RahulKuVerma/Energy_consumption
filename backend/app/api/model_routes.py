import json
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import MLModelResponse

router = APIRouter()

@router.get("", response_model=List[MLModelResponse])
def list_models():
    """Returns all registered models with their performance metrics."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ml_models ORDER BY id ASC")
        rows = cursor.fetchall()
        
        result = []
        for r in rows:
            d = dict(r)
            if d.get("hyperparameters") and isinstance(d["hyperparameters"], str):
                try:
                    d["hyperparameters"] = json.loads(d["hyperparameters"])
                except Exception:
                    pass
            d["is_active"] = bool(d.get("is_active", True))
            result.append(d)
        return result

@router.get("/compare")
def compare_models():
    """
    Returns comparative evaluation metrics, latency expectations,
    and recommended production use-cases across models.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ml_models ORDER BY mae ASC")
        rows = cursor.fetchall()

    comparison = []
    for r in rows:
        m = dict(r)
        m_type = m["model_type"]
        strengths = {
            "linear_regression": "High interpretability, ultra-low latency, deterministic baseline",
            "xgboost": "Robust to non-linear peaks, fast training, excellent feature importance",
            "lstm": "Superior sequence memory, captures multi-scale cyclical dependencies"
        }.get(m_type, "Standard time series model")

        inference_latency_ms = {
            "linear_regression": 1.2,
            "xgboost": 4.5,
            "lstm": 18.0
        }.get(m_type, 5.0)

        comparison.append({
            "id": m["id"],
            "name": m["name"],
            "model_type": m["model_type"],
            "version": m["version"],
            "mae": m["mae"],
            "rmse": m["rmse"],
            "mape": m["mape"],
            "r2_score": m["r2_score"],
            "inference_latency_ms": inference_latency_ms,
            "key_strength": strengths,
            "recommended_use": "Edge / Real-time" if m_type == "linear_regression" else ("Production Standard" if m_type == "xgboost" else "Deep Long-Horizon")
        })

    return {
        "benchmark_dataset": "UCI Household Power Consumption (Hourly)",
        "models": comparison,
        "recommended_model": "xgboost"
    }

@router.get("/{model_id}", response_model=MLModelResponse)
def get_model(model_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ml_models WHERE id = ?", (model_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Model not found")
        d = dict(row)
        if d.get("hyperparameters") and isinstance(d["hyperparameters"], str):
            try:
                d["hyperparameters"] = json.loads(d["hyperparameters"])
            except Exception:
                pass
        d["is_active"] = bool(d.get("is_active", True))
        return d
