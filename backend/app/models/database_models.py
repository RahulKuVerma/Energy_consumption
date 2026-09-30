from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class Dataset:
    id: Optional[int] = None
    name: str = ""
    filename: str = ""
    file_path: str = ""
    file_size_bytes: int = 0
    row_count: int = 0
    sampling_rate: str = "15m"
    start_timestamp: Optional[str] = None
    end_timestamp: Optional[str] = None
    status: str = "processed"
    created_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Dataset":
        valid_keys = {f for f in cls.__dataclass_fields__}
        filtered_data = {k: v for k, v in data.items() if k in valid_keys}
        return cls(**filtered_data)


@dataclass
class EnergyReading:
    id: Optional[int] = None
    dataset_id: Optional[int] = None
    timestamp: str = ""
    global_active_power: float = 0.0
    global_reactive_power: float = 0.0
    voltage: float = 230.0
    global_intensity: float = 0.0
    sub_metering_1: float = 0.0
    sub_metering_2: float = 0.0
    sub_metering_3: float = 0.0
    energy_consumption_kwh: float = 0.0
    total_consumption_kwh: float = 0.0

    def __post_init__(self):
        # Synchronize target naming if one is provided
        if self.energy_consumption_kwh != 0.0 and self.total_consumption_kwh == 0.0:
            self.total_consumption_kwh = self.energy_consumption_kwh
        elif self.total_consumption_kwh != 0.0 and self.energy_consumption_kwh == 0.0:
            self.energy_consumption_kwh = self.total_consumption_kwh

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EnergyReading":
        valid_keys = {f for f in cls.__dataclass_fields__}
        filtered_data = {k: v for k, v in data.items() if k in valid_keys}
        return cls(**filtered_data)


@dataclass
class MLModelRecord:
    id: Optional[int] = None
    name: str = ""
    model_type: str = ""
    version: str = "1.0.0"
    file_path: str = ""
    scaler_path: Optional[str] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    mape: Optional[float] = None
    r2_score: Optional[float] = None
    hyperparameters: Optional[str] = None
    is_active: bool = True
    trained_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MLModelRecord":
        valid_keys = {f for f in cls.__dataclass_fields__}
        filtered_data = {k: v for k, v in data.items() if k in valid_keys}
        return cls(**filtered_data)


@dataclass
class ForecastRecord:
    id: Optional[int] = None
    dataset_id: Optional[int] = None
    model_id: Optional[int] = None
    model_name: str = ""
    horizon_hours: int = 24
    horizon_key: str = "24h"
    granularity: str = "15m"
    mean_forecast: float = 0.0
    peak_forecast: float = 0.0
    min_forecast: float = 0.0
    total_energy_kwh: float = 0.0
    metrics_summary: Optional[str] = None
    created_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ForecastRecord":
        valid_keys = {f for f in cls.__dataclass_fields__}
        filtered_data = {k: v for k, v in data.items() if k in valid_keys}
        return cls(**filtered_data)


@dataclass
class AlertRecord:
    id: Optional[int] = None
    dataset_id: Optional[int] = None
    alert_type: str = "peak_load"
    severity: str = "warning"
    title: str = ""
    message: str = ""
    metric_name: str = "global_active_power"
    actual_value: Optional[float] = None
    threshold_value: Optional[float] = None
    timestamp: str = ""
    is_resolved: bool = False
    created_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AlertRecord":
        valid_keys = {f for f in cls.__dataclass_fields__}
        filtered_data = {k: v for k, v in data.items() if k in valid_keys}
        return cls(**filtered_data)