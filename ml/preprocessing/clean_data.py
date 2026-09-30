import pandas as pd
import numpy as np
from typing import Optional

NUMERICAL_COLS = [
    "Global_active_power",
    "Global_reactive_power",
    "Voltage",
    "Global_intensity",
    "Sub_metering_1",
    "Sub_metering_2",
    "Sub_metering_3"
]

def clean_household_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans household energy data:
    1. Combines 'Date' and 'Time' into a single datetime index.
    2. Casts numerical columns to float32.
    3. Handles missing values using forward-fill followed by backward-fill.
    4. Computes active submetering remaining balance.
    """
    df_clean = df.copy()

    # Parse datetime
    if "Date" in df_clean.columns and "Time" in df_clean.columns:
        datetime_series = df_clean["Date"].astype(str) + " " + df_clean["Time"].astype(str)
        df_clean["timestamp"] = pd.to_datetime(datetime_series, format="%d/%m/%Y %H:%M:%S", errors="coerce")
        df_clean = df_clean.dropna(subset=["timestamp"])
        df_clean = df_clean.drop(columns=["Date", "Time"])
    elif "timestamp" in df_clean.columns:
        df_clean["timestamp"] = pd.to_datetime(df_clean["timestamp"])

    df_clean = df_clean.sort_values("timestamp").set_index("timestamp")

    # Cast numerical columns
    for col in NUMERICAL_COLS:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")

    # Impute missing values
    df_clean[NUMERICAL_COLS] = df_clean[NUMERICAL_COLS].ffill().bfill()

    return df_clean
