import os
import sys
from pathlib import Path
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.app.core.config import settings
from backend.app.core.database import init_db, get_db_connection

def setup_complete_database():
    print("Initializing database tables and seed metadata...")
    init_db(force=True)

    processed_csv = REPO_ROOT / "ml" / "data" / "processed" / "processed_energy_data.csv"
    if not processed_csv.exists():
        print("Processed energy data not found. Please run scripts/preprocess_dataset.py first.")
        return

    print("Loading processed energy readings into database...")
    df = pd.read_csv(processed_csv)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Check if default UCI dataset record exists
        cursor.execute("SELECT id FROM datasets WHERE name = 'UCI Household Power Consumption'")
        row = cursor.fetchone()
        
        start_ts = str(df["timestamp"].min())
        end_ts = str(df["timestamp"].max())
        row_count = len(df)
        file_size = processed_csv.stat().st_size
        
        if not row:
            cursor.execute(
                """
                INSERT INTO datasets (name, filename, file_path, file_size_bytes, row_count, sampling_rate, start_timestamp, end_timestamp, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    "UCI Household Power Consumption",
                    processed_csv.name,
                    str(processed_csv),
                    file_size,
                    row_count,
                    "1 Hour",
                    start_ts,
                    end_ts,
                    "processed"
                )
            )
            dataset_id = cursor.lastrowid
        else:
            dataset_id = row["id"]

        # Insert readings
        cursor.execute("SELECT COUNT(*) as cnt FROM energy_readings WHERE dataset_id = ?", (dataset_id,))
        if cursor.fetchone()["cnt"] == 0:
            records = []
            for _, r in df.iterrows():
                records.append((
                    dataset_id,
                    str(r["timestamp"]),
                    float(r["Global_active_power"]),
                    float(r.get("Global_reactive_power", 0.0)),
                    float(r.get("Voltage", 230.0)),
                    float(r.get("Global_intensity", 0.0)),
                    float(r.get("Sub_metering_1", 0.0)),
                    float(r.get("Sub_metering_2", 0.0)),
                    float(r.get("Sub_metering_3", 0.0)),
                    float(r.get("total_consumption_kwh", float(r["Global_active_power"])))
                ))
            
            cursor.executemany(
                """
                INSERT INTO energy_readings 
                (dataset_id, timestamp, global_active_power, global_reactive_power, voltage, global_intensity, sub_metering_1, sub_metering_2, sub_metering_3, total_consumption_kwh)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                records
            )
            print(f"Inserted {len(records)} readings for dataset ID {dataset_id}.")

    print("Database setup complete! SQLite database ready at:", settings.DATABASE_PATH)

if __name__ == "__main__":
    setup_complete_database()
