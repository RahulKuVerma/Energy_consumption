import re
from typing import Dict, List, Optional, Tuple
import pandas as pd

# Synonyms for standard energy metrics
COLUMN_SYNONYMS = {
    "timestamp": ["timestamp", "datetime", "date_time", "time", "date", "ts", "reading_time"],
    "date": ["date", "reading_date", "day"],
    "time_only": ["time", "reading_time", "clock"],
    "global_active_power": [
        "global_active_power", "active_power", "power_kw", "kw", "active_kw", 
        "power", "load", "demand", "consumption", "energy_kw", "global_active_power_kw"
    ],
    "global_reactive_power": [
        "global_reactive_power", "reactive_power", "kvar", "reactive_kw", "reactive"
    ],
    "voltage": ["voltage", "volt", "volts", "v", "grid_voltage"],
    "global_intensity": ["global_intensity", "intensity", "current", "amperes", "amps", "i"],
    "sub_metering_1": ["sub_metering_1", "kitchen", "meter_1", "sub1", "kitchen_power"],
    "sub_metering_2": ["sub_metering_2", "laundry", "meter_2", "sub2", "laundry_power"],
    "sub_metering_3": ["sub_metering_3", "climate", "hvac", "ac", "heating", "meter_3", "sub3", "climate_power"]
}

def clean_col_name(col: str) -> str:
    """Normalize string: lowercase, strip non-alphanumeric except underscore."""
    return re.sub(r"[^a-zA-Z0-9_]", "", col.lower().strip().replace(" ", "_"))

def detect_column_mappings(df_columns: List[str]) -> Dict[str, Optional[str]]:
    """
    Automatically maps uploaded dataset column names to the canonical schema.
    Returns a dictionary of: {canonical_name: uploaded_column_name_or_None}
    """
    mapped = {}
    normalized = {col: clean_col_name(col) for col in df_columns}
    
    # Check for separate Date and Time columns (like UCI household power dataset)
    date_col = None
    time_col = None
    
    for orig_col, norm_col in normalized.items():
        if norm_col in ["date", "reading_date"]:
            date_col = orig_col
        elif norm_col in ["time", "reading_time"]:
            time_col = orig_col

    for target_col, synonyms in COLUMN_SYNONYMS.items():
        matched = None
        for orig_col, norm_col in normalized.items():
            if norm_col in synonyms:
                matched = orig_col
                break
        mapped[target_col] = matched

    # If separate Date and Time exist, tag them
    if date_col and time_col:
        mapped["date_col"] = date_col
        mapped["time_col"] = time_col

    return mapped

def apply_column_mapping(df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
    """
    Renames columns according to the mapping and ensures timestamp parsing.
    """
    df_mapped = df.copy()

    # Handle composite date + time if mapped
    date_col = mapping.get("date_col")
    time_col = mapping.get("time_col")
    
    if date_col and time_col and date_col in df_mapped.columns and time_col in df_mapped.columns:
        # Try DD/MM/YYYY HH:MM:SS or standard formats
        combined = df_mapped[date_col].astype(str) + " " + df_mapped[time_col].astype(str)
        df_mapped["timestamp"] = pd.to_datetime(combined, errors="coerce", dayfirst=True)
    elif "timestamp" in mapping and mapping["timestamp"] in df_mapped.columns:
        ts_col = mapping["timestamp"]
        df_mapped["timestamp"] = pd.to_datetime(df_mapped[ts_col], errors="coerce", dayfirst=True)
    
    # Rename other mapped columns
    rename_dict = {}
    for target_key, source_col in mapping.items():
        if target_key not in ["date_col", "time_col", "timestamp"] and source_col in df_mapped.columns:
            rename_dict[source_col] = target_key
            
    df_mapped = df_mapped.rename(columns=rename_dict)
    return df_mapped
