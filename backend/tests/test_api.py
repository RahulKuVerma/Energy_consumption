import pytest
from backend.app.core.database import get_db_connection

def test_root_endpoint(admin_client):
    response = admin_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data

def test_health_check(admin_client):
    response = admin_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_list_models(admin_client):
    response = admin_client.get("/api/models")
    assert response.status_code == 200
    models = response.json()
    assert isinstance(models, list)
    assert len(models) >= 1

def test_compare_models(admin_client):
    response = admin_client.get("/api/models/compare")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "recommended_model" in data

def test_analytics_summary(admin_client):
    response = admin_client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_consumption_kwh" in data
    assert "peak_demand_kw" in data
    assert "submetering" in data

def test_analytics_summary_for_empty_dataset(admin_client):
    response = admin_client.get("/api/analytics/summary?dataset_id=-1")
    assert response.status_code == 200
    data = response.json()
    assert data["has_data"] is False
    assert data["total_consumption_kwh"] is None
    assert data["daily_trend"] == []
    assert data["hourly_profile"] == []

def test_system_settings_are_persisted(admin_client):
    original_settings = admin_client.get("/api/settings").json()
    updated_settings = {**original_settings, "kwh_rate": 0.42, "theme": "light"}
    try:
        response = admin_client.put("/api/settings", json=updated_settings)
        assert response.status_code == 200
        assert response.json()["kwh_rate"] == 0.42
        assert response.json()["theme"] == "light"
        assert admin_client.get("/api/settings").json()["kwh_rate"] == 0.42
        assert admin_client.get("/api/settings").json()["theme"] == "light"
    finally:
        admin_client.put("/api/settings", json=original_settings)

def test_saved_cost_and_carbon_settings_update_analytics(admin_client):
    original_settings = admin_client.get("/api/settings").json()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO datasets (name, filename, file_path) VALUES (?, ?, ?)",
            ("settings-test", "settings-test.csv", "uploads/processed/settings-test.csv"),
        )
        dataset_id = cursor.lastrowid
        cursor.execute(
            """
            INSERT INTO energy_readings
            (dataset_id, timestamp, global_active_power, total_consumption_kwh)
            VALUES (?, ?, ?, ?)
            """,
            (dataset_id, "2026-09-30 12:00:00", 2.0, 10.0),
        )

    try:
        updated_settings = {**original_settings, "kwh_rate": 0.42, "co2_factor": 0.5}
        save_response = admin_client.put("/api/settings", json=updated_settings)
        assert save_response.status_code == 200

        response = admin_client.get(f"/api/analytics/summary?dataset_id={dataset_id}")
        assert response.status_code == 200
        analytics = response.json()
        assert analytics["estimated_cost"] == 4.2
        assert analytics["estimated_co2_kg"] == 5.0
    finally:
        admin_client.put("/api/settings", json=original_settings)
        with get_db_connection() as conn:
            conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))

def test_alerts_list(admin_client):
    response = admin_client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)

def test_quick_forecast(admin_client):
    response = admin_client.get("/api/forecast/quick?model=xgboost&horizon=12")
    assert response.status_code == 200
    data = response.json()
    assert data["horizon_hours"] == 12
    assert len(data["forecast_items"]) == 12
    assert "mean_forecast" in data
