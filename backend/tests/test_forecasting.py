import pytest
from backend.app.services.forecasting_service import forecasting_service

def test_forecasting_models_output():
    for model_name in ["linear_regression", "xgboost", "lstm"]:
        fc = forecasting_service.generate_forecast(
            model_name=model_name,
            horizon_hours=12
        )
        assert fc["model_name"] == model_name
        assert fc["horizon_hours"] == 12
        assert len(fc["forecast_items"]) == 12
        assert fc["mean_forecast"] > 0
        assert fc["peak_forecast"] >= fc["min_forecast"]
        
        # Check confidence intervals
        for item in fc["forecast_items"]:
            assert item["predicted_value"] > 0
            assert item["upper_bound"] >= item["predicted_value"]
            assert item["lower_bound"] <= item["predicted_value"]
