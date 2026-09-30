import os
from pathlib import Path
from typing import Optional, Tuple
import pandas as pd

DEFAULT_RAW_PATH = Path(__file__).resolve().parent.parent / "data" / "raw" / "household_power_consumption.txt"

def load_raw_dataset(file_path: Optional[Path] = None, nrows: Optional[int] = None) -> pd.DataFrame:
    """
    Loads raw UCI Household Power Consumption dataset.
    Default delimiter is ';' and missing values are marked with '?'.
    """
    path = file_path or DEFAULT_RAW_PATH
    if not Path(path).exists():
        raise FileNotFoundError(f"Raw data file not found at: {path}")

    # Inspect delimiter
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        first_line = f.readline()
        sep = ";" if ";" in first_line else ","

    df = pd.read_csv(
        path,
        sep=sep,
        nrows=nrows,
        low_memory=False,
        na_values=["?", "NA", "null", "NaN", ""]
    )
    return df

if __name__ == "__main__":
    df = load_raw_dataset(nrows=10)
    print("Loaded sample shape:", df.shape)
    print(df.head())
