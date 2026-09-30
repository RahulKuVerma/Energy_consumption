import pytest
import pandas as pd
from backend.app.utils.column_mapper import detect_column_mappings, apply_column_mapping
from backend.app.utils.unit_converter import power_to_energy_kwh, calculate_energy_cost

def test_column_mapping_detection():
    cols = ["Date", "Time", "Global_active_power", "Voltage", "Sub_metering_1"]
    mappings = detect_column_mappings(cols)
    assert mappings["global_active_power"] == "Global_active_power"
    assert mappings["voltage"] == "Voltage"
    assert mappings["date_col"] == "Date"
    assert mappings["time_col"] == "Time"

def test_apply_column_mapping_composite_datetime():
    df = pd.DataFrame({
        "Date": ["01/01/2026", "01/01/2026"],
        "Time": ["12:00:00", "13:00:00"],
        "Global_active_power": [1.5, 2.0]
    })
    mapping = {
        "date_col": "Date",
        "time_col": "Time",
        "global_active_power": "Global_active_power"
    }
    mapped = apply_column_mapping(df, mapping)
    assert "timestamp" in mapped.columns
    assert "global_active_power" in mapped.columns
    assert pd.api.types.is_datetime64_any_dtype(mapped["timestamp"])

def test_unit_conversions():
    # 2.5 kW over 2 hours = 5.0 kWh
    kwh = power_to_energy_kwh(2.5, hours=2.0)
    assert kwh == 5.0

    # 5.0 kWh at $0.20 = $1.00
    cost = calculate_energy_cost(5.0, rate_per_kwh=0.20)
    assert cost == 1.0
