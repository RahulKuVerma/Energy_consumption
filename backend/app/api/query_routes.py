import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from backend.app.services.forecasting_service import forecasting_service
from backend.app.services.analytics_service import analytics_service
from backend.app.core.database import get_db_connection

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    dataset_id: Optional[int] = None
    model_name: Optional[str] = "xgboost"

class QueryResponse(BaseModel):
    query: str
    intent: str
    parameters: Dict[str, Any]
    numerical_result: Dict[str, Any]
    explanation: str
    chart_data: Optional[List[Dict[str, Any]]] = None

@router.post("", response_model=QueryResponse)
def process_user_query(req: QueryRequest):
    q = req.query.lower().strip()
    
    # 1. Intent Detection
    # Intent A: Peak / Max consumption question
    if any(w in q for w in ["peak", "highest", "maximum", "max load"]):
        summary = analytics_service.get_summary_analytics(req.dataset_id)
        peak_val = summary["peak_demand_kw"]
        peak_ts = summary["peak_timestamp"]
        
        explanation = (
            f"The peak active power demand recorded was {peak_val:.2f} kW at {peak_ts}. "
            f"This occurred during standard high-demand evening hours."
        )
        return {
            "query": req.query,
            "intent": "QUERY_PEAK_CONSUMPTION",
            "parameters": {"target": "peak_demand_kw"},
            "numerical_result": {"peak_kw": peak_val, "timestamp": peak_ts},
            "explanation": explanation,
            "chart_data": summary["daily_trend"]
        }

    # Intent B: Average / Daily consumption question
    elif any(w in q for w in ["average", "avg", "mean", "daily"]):
        summary = analytics_service.get_summary_analytics(req.dataset_id)
        avg_kw = summary["avg_hourly_kw"]
        total_kwh = summary["total_consumption_kwh"]
        cost = summary["estimated_cost"]
        
        explanation = (
            f"Average hourly load is {avg_kw:.2f} kW, generating a cumulative total of "
            f"{total_kwh:.1f} kWh consumed (approx. ${cost:.2f} at current rates)."
        )
        return {
            "query": req.query,
            "intent": "QUERY_AVERAGE_CONSUMPTION",
            "parameters": {"target": "avg_hourly_kw"},
            "numerical_result": {"avg_hourly_kw": avg_kw, "total_kwh": total_kwh, "estimated_cost": cost},
            "explanation": explanation,
            "chart_data": summary["hourly_profile"]
        }

    # Intent C: Unusual / Anomaly question
    elif any(w in q for w in ["unusual", "anomaly", "abnormal", "spike", "sag"]):
        anomalies = analytics_service.detect_anomalies(req.dataset_id)
        count = len(anomalies)
        
        if count > 0:
            top = anomalies[0]
            explanation = (
                f"Detected {count} statistically significant consumption anomalies (|z-score| >= 2.5). "
                f"Most prominent anomaly was at {top['timestamp']} with {top['global_active_power']:.2f} kW ({top['type']})."
            )
        else:
            explanation = "No severe anomalies (|z-score| >= 2.5) detected within the analyzed timeline."

        return {
            "query": req.query,
            "intent": "QUERY_ANOMALIES",
            "parameters": {"threshold_z": 2.5},
            "numerical_result": {"anomaly_count": count, "anomalies": anomalies[:5]},
            "explanation": explanation,
            "chart_data": anomalies[:10]
        }

    # Intent D: Forecasting questions ("predict next 6 hours", "forecast tomorrow", "next week")
    else:
        # Horizon parsing
        horizon_hours = 24
        if "6 hour" in q or "6h" in q:
            horizon_hours = 6
        elif "12 hour" in q or "12h" in q:
            horizon_hours = 12
        elif "48 hour" in q or "2 day" in q:
            horizon_hours = 48
        elif "3 day" in q or "72 hour" in q:
            horizon_hours = 72
        elif "week" in q or "7 day" in q or "168" in q:
            horizon_hours = 168
        elif "tomorrow" in q or "1 day" in q or "24 hour" in q or "24h" in q:
            horizon_hours = 24

        # Execute ML Model
        fc = forecasting_service.generate_forecast(
            model_name=req.model_name or "xgboost",
            dataset_id=req.dataset_id,
            horizon_hours=horizon_hours
        )

        mean_val = fc["mean_forecast"]
        peak_val = fc["peak_forecast"]
        total_kwh = fc["total_energy_kwh"]

        explanation = (
            f"Using the {req.model_name.upper()} model for the next {horizon_hours} hours: "
            f"predicted average demand is {mean_val:.2f} kW, with an anticipated peak of {peak_val:.2f} kW, "
            f"amounting to an estimated {total_kwh:.2f} kWh total consumption."
        )

        return {
            "query": req.query,
            "intent": "EXECUTE_FORECAST",
            "parameters": {
                "horizon_hours": horizon_hours,
                "model_name": req.model_name
            },
            "numerical_result": {
                "mean_kw": mean_val,
                "peak_kw": peak_val,
                "total_kwh": total_kwh,
                "forecast_id": fc["forecast_id"]
            },
            "explanation": explanation,
            "chart_data": fc["forecast_items"]
        }
