from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import ForecastRequest, ForecastResponse
from backend.app.services.forecasting_service import forecasting_service

router = APIRouter()

@router.post("", response_model=ForecastResponse)
def create_forecast(req: ForecastRequest):
    """Generates a new time-series forecast using selected ML model and horizon."""
    try:
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
    dataset_id: Optional[int] = None
):
    """Convenience endpoint for dynamic dashboard horizon sliders and model switches."""
    return forecasting_service.generate_forecast(
        model_name=model,
        dataset_id=dataset_id,
        horizon_hours=horizon
    )

@router.get("/history")
def list_forecast_history(limit: int = 10):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, dataset_id, model_name, horizon_hours, granularity,
                   mean_forecast, peak_forecast, min_forecast, total_energy_kwh, created_at
            FROM forecasts
            ORDER BY created_at DESC LIMIT ?
            """,
            (limit,)
        )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.get("/{forecast_id}")
def get_forecast_detail(forecast_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM forecasts WHERE id = ?", (forecast_id,))
        fc = cursor.fetchone()
        if not fc:
            raise HTTPException(status_code=404, detail="Forecast run not found")

        cursor.execute(
            "SELECT * FROM forecast_items WHERE forecast_id = ? ORDER BY timestamp ASC",
            (forecast_id,)
        )
        items = cursor.fetchall()

        res = dict(fc)
        res["forecast_items"] = [dict(it) for it in items]
        return res
