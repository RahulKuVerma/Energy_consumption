from typing import Any, Dict
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import SystemSettings

SETTING_STORAGE_KEYS = {
    "theme": "theme",
    "peak_threshold_kw": "peak_threshold_kw",
    "anomaly_zscore_threshold": "anomaly_zscore_threshold",
    "kwh_rate": "kwh_rate",
    "co2_factor": "co2_factor",
    "default_model": "default_forecast_model",
    "default_horizon": "default_horizon_hours",
    "resample_freq": "resample_frequency",
    "alerts_enabled": "alerts_enabled",
    "currency": "currency_symbol",
}
CURRENCY_SYMBOLS = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹"}


def _model_values(model: SystemSettings) -> Dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


DEFAULT_SETTINGS = _model_values(SystemSettings())


def get_system_settings() -> Dict[str, Any]:
    with get_db_connection() as conn:
        rows = conn.execute("SELECT key, value FROM system_settings").fetchall()

    stored = {row["key"]: row["value"] for row in rows}
    values = DEFAULT_SETTINGS.copy()
    currency_codes = {symbol: code for code, symbol in CURRENCY_SYMBOLS.items()}

    for field, storage_key in SETTING_STORAGE_KEYS.items():
        raw_value = stored.get(storage_key)
        if raw_value is None:
            continue
        try:
            if field == "currency":
                values[field] = currency_codes.get(raw_value, raw_value)
            elif isinstance(values[field], bool):
                values[field] = str(raw_value).lower() in ("1", "true", "yes")
            else:
                values[field] = type(values[field])(raw_value)
        except (TypeError, ValueError):
            continue

    return _model_values(SystemSettings(**values))


def update_system_settings(payload: SystemSettings) -> Dict[str, Any]:
    values = _model_values(payload)
    records = []
    for field, storage_key in SETTING_STORAGE_KEYS.items():
        value = values[field]
        if field == "currency":
            value = CURRENCY_SYMBOLS[value]
        elif field == "alerts_enabled":
            value = "1" if value else "0"
        records.append((storage_key, str(value)))

    with get_db_connection() as conn:
        conn.executemany(
            """
            INSERT INTO system_settings (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            records,
        )

    return get_system_settings()