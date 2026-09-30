import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

# Add repo root to pythonpath
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.preprocessing.clean_data import clean_household_data
from ml.preprocessing.resample_data import resample_to_hourly

def generate_uci_raw_dataset(dest_file: Path, num_days: int = 45):
    """
    Synthesizes a realistic UCI household_power_consumption.txt dataset
    with Date (DD/MM/YYYY), Time (HH:MM:SS), Global_active_power, Global_reactive_power,
    Voltage, Global_intensity, Sub_metering_1, Sub_metering_2, Sub_metering_3.
    """
    dest_file.parent.mkdir(parents=True, exist_ok=True)
    start_date = datetime(2026, 1, 1, 0, 0, 0)
    
    # 1-minute intervals for num_days
    total_minutes = num_days * 24 * 60
    records = []
    
    current_time = start_date
    np.random.seed(42)

    # Pre-generate noise and cyclical bases
    for minute in range(total_minutes):
        hr = current_time.hour
        day_of_week = current_time.weekday()
        is_weekend = day_of_week in [5, 6]

        # Diurnal pattern
        # Morning peak (7:00 - 9:00), Evening peak (18:00 - 22:00), Night dip (01:00 - 05:00)
        base_power = 0.5 + 0.4 * np.sin((hr - 6) * np.pi / 12)
        if 7 <= hr <= 9:
            base_power += 1.2
        elif 18 <= hr <= 22:
            base_power += 2.0
        elif 1 <= hr <= 5:
            base_power = 0.35

        if is_weekend:
            base_power *= 1.25

        active_power = max(0.12, base_power + np.random.normal(0, 0.12))
        reactive_power = max(0.04, active_power * 0.12 + np.random.normal(0, 0.02))
        voltage = 238.0 + np.random.normal(0, 2.5) - (0.5 * active_power)
        intensity = (active_power * 1000.0) / voltage

        # Submetering:
        # Sub 1: Kitchen (dishwasher, microwave around 8:00, 12:30, 20:00)
        sub1 = 0.0
        if (hr == 8 and current_time.minute < 30) or (hr == 20 and current_time.minute < 45):
            sub1 = max(0.0, np.random.normal(18.0, 4.0))

        # Sub 2: Laundry (washing machine on weekends or evenings)
        sub2 = 0.0
        if (is_weekend and 10 <= hr <= 14) or (not is_weekend and hr == 21):
            sub2 = max(0.0, np.random.normal(25.0, 5.0))

        # Sub 3: Climate/HVAC (heating/AC active during midday and evening)
        sub3 = max(0.0, (12.0 if 14 <= hr <= 23 else 4.0) + np.random.normal(0, 2.0))

        # Formatting matching UCI dataset
        d_str = current_time.strftime("%d/%m/%Y")
        t_str = current_time.strftime("%H:%M:%S")

        # Occasionally add missing value "?" with 0.1% chance
        if np.random.rand() < 0.001:
            line = f"{d_str};{t_str};?;?;?;?;?;?;?"
        else:
            line = f"{d_str};{t_str};{active_power:.3f};{reactive_power:.3f};{voltage:.2f};{intensity:.1f};{sub1:.1f};{sub2:.1f};{sub3:.1f}"

        records.append(line)
        current_time += timedelta(minutes=1)

    with open(dest_file, "w", encoding="utf-8") as f:
        f.write("Date;Time;Global_active_power;Global_reactive_power;Voltage;Global_intensity;Sub_metering_1;Sub_metering_2;Sub_metering_3\n")
        f.write("\n".join(records))

    print(f"Generated raw dataset at {dest_file} with {len(records)} rows ({num_days} days).")

def process_raw_to_processed():
    raw_file = REPO_ROOT / "ml" / "data" / "raw" / "household_power_consumption.txt"
    processed_file = REPO_ROOT / "ml" / "data" / "processed" / "processed_energy_data.csv"
    processed_file.parent.mkdir(parents=True, exist_ok=True)

    if not raw_file.exists():
        print("Raw file does not exist, creating raw sample...")
        generate_uci_raw_dataset(raw_file, num_days=30)

    print("Cleaning raw dataset...")
    df_raw = pd.read_csv(raw_file, sep=";", na_values=["?", "NA", "null", "NaN", ""], low_memory=False)
    df_clean = clean_household_data(df_raw)
    
    print("Resampling to hourly...")
    df_hourly = resample_to_hourly(df_clean)
    
    # Reset index and write
    df_hourly.reset_index().to_csv(processed_file, index=False)
    print(f"Saved processed hourly dataset to {processed_file} with shape {df_hourly.shape}.")

if __name__ == "__main__":
    process_raw_to_processed()
