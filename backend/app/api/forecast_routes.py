from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import ForecastRequest, ForecastResponse
from backend.app.services.forecasting_service import forecasting_service
from backend.app.core.auth import get_current_user

router = APIRouter()


def validate_forecast_access(dataset_id, model_name, user):
    with get_db_connection() as conn:
        if user["role"] != "admin":
            if dataset_id is None:
                raise HTTPException(status_code=400, detail="Select one of your datasets before forecasting")
            dataset = conn.execute(
                "SELECT id FROM datasets WHERE id = ? AND owner_id = ?",
                (dataset_id, user["id"]),
            ).fetchone()
            if not dataset:
                raise HTTPException(status_code=404, detail="Dataset not found")
            model = conn.execute(
                "SELECT id FROM ml_models WHERE model_type = ? AND is_published = 1",
                (model_name,),
            ).fetchone()
            if not model:
                raise HTTPException(status_code=403, detail="This model is not currently published")

@router.post("", response_model=ForecastResponse)
def create_forecast(req: ForecastRequest, user=Depends(get_current_user)):
    """Generates a new time-series forecast using selected ML model and horizon."""
    try:
        validate_forecast_access(req.dataset_id, req.model_name, user)
        result = forecasting_service.generate_forecast(
            model_name=req.model_name,
            dataset_id=req.dataset_id,
            horizon_hours=req.horizon_hours
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@router.get("/quick")
def quick_forecast(
    model: str = Query("xgboost", pattern="^(linear_regression|xgboost|lstm)$"),
    horizon: int = Query(24, ge=6, le=336),
    dataset_id: Optional[int] = None,
    user=Depends(get_current_user),
):
    """Convenience endpoint for dynamic dashboard horizon sliders and model switches."""
    validate_forecast_access(dataset_id, model, user)
    return forecasting_service.generate_forecast(
        model_name=model,
        dataset_id=dataset_id,
        horizon_hours=horizon
    )

@router.get("/history")
def list_forecast_history(limit: int = 10, user=Depends(get_current_user)):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user["role"] == "admin":
            cursor.execute(
                """
                SELECT id, dataset_id, model_name, horizon_hours, granularity,
                       mean_forecast, peak_forecast, min_forecast, total_energy_kwh, created_at
                FROM forecasts ORDER BY created_at DESC LIMIT ?
                """,
                (limit,),
            )
        else:
            cursor.execute(
                """
                SELECT f.id, f.dataset_id, f.model_name, f.horizon_hours, f.granularity,
                       f.mean_forecast, f.peak_forecast, f.min_forecast, f.total_energy_kwh, f.created_at
                FROM forecasts f JOIN datasets d ON d.id = f.dataset_id
                WHERE d.owner_id = ? AND EXISTS (
                    SELECT 1 FROM ml_models m WHERE m.model_type = f.model_name AND m.is_published = 1
                )
                ORDER BY f.created_at DESC LIMIT ?
                """,
                (user["id"], limit),
            )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.get("/{forecast_id}")
def get_forecast_detail(forecast_id: int, user=Depends(get_current_user)):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM forecasts WHERE id = ?", (forecast_id,))
        fc = cursor.fetchone()
        if not fc:
            raise HTTPException(status_code=404, detail="Forecast run not found")
        if user["role"] != "admin":
            access = cursor.execute(
                """
                SELECT 1 FROM datasets d JOIN ml_models m ON m.model_type = ?
                WHERE d.id = ? AND d.owner_id = ? AND m.is_published = 1
                """,
                (fc["model_name"], fc["dataset_id"], user["id"]),
            ).fetchone()
            if not access:
                raise HTTPException(status_code=404, detail="Forecast run not found")

        cursor.execute(
            "SELECT * FROM forecast_items WHERE forecast_id = ? ORDER BY timestamp ASC",
            (forecast_id,)
        )
        items = cursor.fetchall()

        res = dict(fc)
        res["forecast_items"] = [dict(it) for it in items]
        return res
