import pandas as pd

def resample_to_hourly(df_clean: pd.DataFrame) -> pd.DataFrame:
    """
    Resamples minute-level cleaned energy DataFrame to uniform 1-hour frequency.
    Computes mean for active/reactive power, voltage, and intensity.
    Computes sum / watt-hour conversion for submeterings.
    """
    if not isinstance(df_clean.index, pd.DatetimeIndex):
        raise ValueError("DataFrame index must be DatetimeIndex for resampling.")

    agg_rules = {
        "Global_active_power": "mean",
        "Global_reactive_power": "mean",
        "Voltage": "mean",
        "Global_intensity": "mean",
        "Sub_metering_1": "mean",
        "Sub_metering_2": "mean",
        "Sub_metering_3": "mean",
    }
    existing_rules = {col: agg_rules[col] for col in agg_rules if col in df_clean.columns}

    df_hourly = df_clean.resample("1h").agg(existing_rules)
    df_hourly = df_hourly.interpolate(method="time").ffill().bfill()
    
    # Calculate energy consumed in 1 hour (kWh = kW * 1h)
    if "Global_active_power" in df_hourly.columns:
        df_hourly["total_consumption_kwh"] = df_hourly["Global_active_power"] * 1.0

    return df_hourly

def resample_to_daily(df_hourly: pd.DataFrame) -> pd.DataFrame:
    """Resamples hourly series to daily summary metrics."""
    agg_rules = {
        "Global_active_power": ["mean", "max", "min"],
        "total_consumption_kwh": "sum"
    }
    return df_hourly.resample("1D").agg(agg_rules)
