import json
import tempfile
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import MLModelResponse
from backend.app.core.auth import get_current_user, require_admin
from backend.app.core.config import settings

router = APIRouter()


class PublicationUpdate(BaseModel):
    is_published: bool


class TrainingRequest(BaseModel):
    dataset_id: int

@router.get("", response_model=List[MLModelResponse])
def list_models(user=Depends(get_current_user)):
    """Returns all registered models with their performance metrics."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user["role"] == "admin":
            cursor.execute("SELECT * FROM ml_models ORDER BY id ASC")
        else:
            cursor.execute("SELECT * FROM ml_models WHERE is_published = 1 ORDER BY id ASC")
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
            d["is_published"] = bool(d.get("is_published", False))
            result.append(d)
        return result

@router.get("/compare")
def compare_models(user=Depends(get_current_user)):
    """
    Returns comparative evaluation metrics, latency expectations,
    and recommended production use-cases across models.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user["role"] == "admin":
            cursor.execute("SELECT * FROM ml_models ORDER BY mae ASC")
        else:
            cursor.execute("SELECT * FROM ml_models WHERE is_published = 1 ORDER BY mae ASC")
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


@router.post("/train")
def train_models(payload: TrainingRequest, _admin=Depends(require_admin)):
    with get_db_connection() as conn:
        dataset = conn.execute("SELECT file_path FROM datasets WHERE id = ?", (payload.dataset_id,)).fetchone()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    dataset_path = Path(dataset["file_path"])
    if not dataset_path.exists():
        raise HTTPException(status_code=404, detail="Processed dataset file is missing")

    try:
        frame = pd.read_csv(dataset_path)
        if "global_active_power" in frame.columns:
            frame = frame.rename(columns={"global_active_power": "Global_active_power"})
        if "timestamp" not in frame.columns or "Global_active_power" not in frame.columns:
            raise ValueError("Training requires timestamp and global active power columns")
        with tempfile.TemporaryDirectory(dir=settings.TEMP_UPLOAD_DIR) as temp_dir:
            training_path = Path(temp_dir) / "training_dataset.csv"
            frame.to_csv(training_path, index=False)

            from ml.training.train_linear import train_linear_regression
            from ml.training.train_xgboost import train_xgboost
            from ml.training.train_lstm import train_lstm

            metrics = {
                "linear_regression": train_linear_regression(data_path=training_path),
                "xgboost": train_xgboost(data_path=training_path),
                "lstm": train_lstm(data_path=training_path),
            }
        with get_db_connection() as conn:
            for model_type, result in metrics.items():
                conn.execute(
                    "UPDATE ml_models SET mae = ?, rmse = ?, mape = ?, r2_score = ?, trained_at = CURRENT_TIMESTAMP WHERE model_type = ?",
                    (result["mae"], result["rmse"], result["mape"], result["r2_score"], model_type),
                )
        return {"status": "success", "dataset_id": payload.dataset_id, "models": metrics}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model training failed: {exc}")


@router.put("/{model_id}/publication")
def set_model_publication(model_id: int, payload: PublicationUpdate, _admin=Depends(require_admin)):
    with get_db_connection() as conn:
        cursor = conn.execute(
            "UPDATE ml_models SET is_published = ? WHERE id = ?",
            (int(payload.is_published), model_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Model not found")
    return {"id": model_id, "is_published": payload.is_published}

@router.get("/{model_id}", response_model=MLModelResponse)
def get_model(model_id: int, user=Depends(get_current_user)):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user["role"] == "admin":
            cursor.execute("SELECT * FROM ml_models WHERE id = ?", (model_id,))
        else:
            cursor.execute("SELECT * FROM ml_models WHERE id = ? AND is_published = 1", (model_id,))
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
        d["is_published"] = bool(d.get("is_published", False))
        return d
