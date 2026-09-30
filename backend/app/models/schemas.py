from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union, Literal
from datetime import datetime

# --- Dataset Schemas ---
class DatasetBase(BaseModel):
    name: str
    filename: str
    row_count: int
    sampling_rate: Optional[str] = "1 Hour"
    start_timestamp: Optional[Any] = None
    end_timestamp: Optional[Any] = None
    status: Optional[str] = "processed"

class DatasetCreate(DatasetBase):
    file_path: str
    file_size_bytes: int = 0

class DatasetResponse(DatasetBase):
    id: int
    file_path: str
    file_size_bytes: int
    created_at: Optional[Any] = None

# --- Reading Schemas ---
class EnergyReadingItem(BaseModel):
    id: Optional[int] = None
    dataset_id: Optional[int] = None
    timestamp: str
    global_active_power: float
    global_reactive_power: Optional[float] = 0.0
    voltage: Optional[float] = 230.0
    global_intensity: Optional[float] = 0.0
    sub_metering_1: Optional[float] = 0.0
    sub_metering_2: Optional[float] = 0.0
    sub_metering_3: Optional[float] = 0.0
    total_consumption_kwh: Optional[float] = 0.0

class ReadingsQueryResponse(BaseModel):
    total_count: int
    page: int
    page_size: int
    readings: List[EnergyReadingItem]

# --- Model Schemas ---
class MLModelResponse(BaseModel):
    id: int
    name: str
    model_type: str
    version: str
    mae: Optional[float] = None
    rmse: Optional[float] = None
    mape: Optional[float] = None
    r2_score: Optional[float] = None
    hyperparameters: Optional[Dict[str, Any]] = None
    is_active: bool
    trained_at: Optional[Any] = None

# --- Forecast Schemas ---
class ForecastRequest(BaseModel):
    dataset_id: Optional[int] = None
    model_name: str = "xgboost"  # 'linear_regression', 'xgboost', 'lstm'
    horizon_hours: int = 24
    granularity: str = "hourly"

class ForecastItem(BaseModel):
    timestamp: Any
    predicted_value: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    actual_value: Optional[float] = None

class ForecastResponse(BaseModel):
    forecast_id: int
    model_name: str
    horizon_hours: int
    granularity: str
    mean_forecast: float
    peak_forecast: float
    min_forecast: float
    total_energy_kwh: float
    metrics_summary: Optional[Dict[str, Any]] = None
    forecast_items: List[ForecastItem]
    created_at: Optional[Any] = None

# --- Analytics Schemas ---
class SubmeteringBreakdown(BaseModel):
    kitchen_kwh: float
    laundry_kwh: float
    climate_kwh: float
    other_kwh: float

class AnalyticsSummaryResponse(BaseModel):
    total_consumption_kwh: float
    avg_hourly_kw: float
    peak_demand_kw: float
    peak_timestamp: Optional[Any] = None
    estimated_cost: float
    estimated_co2_kg: float
    submetering: SubmeteringBreakdown
    daily_trend: List[Dict[str, Any]]
    hourly_profile: List[Dict[str, Any]]

# --- Alert Schemas ---
class AlertItem(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    message: str
    metric_name: str
    actual_value: Optional[float] = None
    threshold_value: Optional[float] = None
    timestamp: Any
    is_resolved: bool
    created_at: Optional[Any] = None

class AlertCreate(BaseModel):
    alert_type: str
    severity: str
    title: str
    message: str
    metric_name: str = "global_active_power"
    actual_value: float
    threshold_value: float
    timestamp: Optional[str] = None

# --- System Settings Schemas ---
class SystemSettingItem(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[str] = None

class SystemSettings(BaseModel):
    theme: Literal["dark", "light"] = "dark"
    peak_threshold_kw: float = Field(default=4.5, ge=0.5, le=20)
    anomaly_zscore_threshold: float = Field(default=2.5, ge=1, le=5)
    kwh_rate: float = Field(default=0.18, ge=0, le=2)
    co2_factor: float = Field(default=0.233, ge=0.01, le=2)
    default_model: Literal["linear_regression", "xgboost", "lstm"] = "xgboost"
    default_horizon: Literal[6, 12, 24, 48, 72, 168] = 24
    resample_freq: Literal["15min", "30min", "1h", "1D"] = "1h"
    alerts_enabled: bool = True
    currency: Literal["USD", "EUR", "GBP", "INR"] = "USD"
