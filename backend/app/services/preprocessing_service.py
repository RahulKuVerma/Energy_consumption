import os
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

# Resilient imports for uvicorn directory execution
try:
    from app.core.config import settings
    from app.core.database import get_db_connection
    from app.utils.column_mapper import apply_column_mapping
    from app.services.file_service import FileService
except ImportError:
    from backend.app.core.config import settings
    from backend.app.core.database import get_db_connection
    from backend.app.utils.column_mapper import apply_column_mapping
    from backend.app.services.file_service import FileService


class PreprocessingService:
    @staticmethod
    def process_and_store_dataset(
        file_path: Path,
        mapping: Dict[str, str],
        dataset_name: str,
        resample_freq: str = "15m"
    ) -> Dict[str, Any]:
        """
        Full pipeline:
        1. Loads dataset (.csv, .txt, or .xlsx) using auto-detected delimiter/engine
        2. Applies column mappings
        3. Cleans null values via forward-fill & backward-fill interpolation
        4. Resamples to uniform frequency (default 15 minutes: mean power, converted to kWh)
        5. Computes total consumption in kWh: mean(kW) * interval_hours (e.g. 0.25 for 15m)
        6. Persists clean CSV in uploads/processed/
        7. Inserts dataset record and readings into SQLite database
        """
        file_path = Path(file_path)
        ext = file_path.suffix.lower()

        # 1. Load File according to extension
        if ext == ".xlsx":
            df = pd.read_excel(file_path)
        else:
            try:
                _, sep = FileService.read_dataset_sample(file_path, max_rows=10)
            except Exception:
                sep = ";" if ";" in open(file_path, 'r', encoding='utf-8', errors='ignore').readline() else ","

            df = pd.read_csv(
                file_path,
                sep=sep,
                low_memory=False,
                na_values=["?", "NA", "null", "NaN", ""]
            )

        # 2. Apply column mapping
        df_mapped = apply_column_mapping(df, mapping)

        if "timestamp" not in df_mapped.columns:
            raise ValueError("Could not parse or map a valid 'timestamp' column.")

        # Ensure timestamp is datetime and sort
        df_mapped["timestamp"] = pd.to_datetime(df_mapped["timestamp"], errors="coerce")
        df_mapped = df_mapped.dropna(subset=["timestamp"]).sort_values("timestamp")

        # Ensure numerical columns
        num_cols = [
            "global_active_power", "global_reactive_power", "voltage",
            "global_intensity", "sub_metering_1", "sub_metering_2", "sub_metering_3"
        ]
        for col in num_cols:
            if col in df_mapped.columns:
                df_mapped[col] = pd.to_numeric(df_mapped[col], errors="coerce")
            else:
                df_mapped[col] = 0.0

        # Handle missing values safely
        df_mapped[num_cols] = df_mapped[num_cols].ffill().bfill().fillna(0.0)

        # Set index for time-series resampling
        df_mapped = df_mapped.set_index("timestamp")

        # 3. Dynamic Interval Hour Multiplier Calculation
        freq_lower = str(resample_freq).lower()
        if "15" in freq_lower:
            hours_per_interval = 0.25
            sampling_label = "15m"
        elif "30" in freq_lower:
            hours_per_interval = 0.5
            sampling_label = "30m"
        elif "1h" in freq_lower or "60" in freq_lower:
            hours_per_interval = 1.0
            sampling_label = "1h"
        else:
            try:
                hours_per_interval = pd.Timedelta(resample_freq).total_seconds() / 3600.0
                sampling_label = resample_freq
            except Exception:
                hours_per_interval = 0.25
                sampling_label = "15m"

        # Resample to regular frequency
        resampled_cols = {
            "global_active_power": "mean",
            "global_reactive_power": "mean",
            "voltage": "mean",
            "global_intensity": "mean",
            "sub_metering_1": "mean",
            "sub_metering_2": "mean",
            "sub_metering_3": "mean",
        }
        existing_resample = {k: v for k, v in resampled_cols.items() if k in df_mapped.columns}

        df_resampled = df_mapped[list(existing_resample.keys())].resample(resample_freq).agg(existing_resample)
        df_resampled = df_resampled.interpolate(method="time").ffill().bfill()

        # Compute Energy Target: kWh = mean(kW) * hours_per_interval
        df_resampled["total_consumption_kwh"] = df_resampled["global_active_power"] * hours_per_interval
        df_resampled["energy_consumption_kwh"] = df_resampled["total_consumption_kwh"]
        df_resampled = df_resampled.reset_index()

        # 4. Save processed CSV
        processed_dir = settings.PROCESSED_UPLOAD_DIR
        processed_dir.mkdir(parents=True, exist_ok=True)
        processed_file = processed_dir / f"processed_{Path(file_path).stem}.csv"
        df_resampled.to_csv(processed_file, index=False)

        # 5. Insert dataset and readings into database
        start_ts = str(df_resampled["timestamp"].min())
        end_ts = str(df_resampled["timestamp"].max())
        row_count = len(df_resampled)
        file_size = processed_file.stat().st_size

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO datasets (name, filename, file_path, file_size_bytes, row_count, sampling_rate, start_timestamp, end_timestamp, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    dataset_name,
                    processed_file.name,
                    str(processed_file),
                    file_size,
                    row_count,
                    sampling_label,
                    start_ts,
                    end_ts,
                    "processed"
                )
            )
            dataset_id = cursor.lastrowid

            # Batch insert readings
            records = []
            for _, row in df_resampled.iterrows():
                records.append((
                    dataset_id,
                    str(row["timestamp"]),
                    float(row["global_active_power"]),
                    float(row.get("global_reactive_power", 0.0)),
                    float(row.get("voltage", 230.0)),
                    float(row.get("global_intensity", 0.0)),
                    float(row.get("sub_metering_1", 0.0)),
                    float(row.get("sub_metering_2", 0.0)),
                    float(row.get("sub_metering_3", 0.0)),
                    float(row.get("total_consumption_kwh", 0.0))
                ))

            cursor.executemany(
                """
                INSERT INTO energy_readings 
                (dataset_id, timestamp, global_active_power, global_reactive_power, voltage, global_intensity, sub_metering_1, sub_metering_2, sub_metering_3, total_consumption_kwh)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                records
            )

        return {
            "dataset_id": dataset_id,
            "name": dataset_name,
            "processed_file": str(processed_file),
            "row_count": row_count,
            "start_timestamp": start_ts,
            "end_timestamp": end_ts,
            "sampling_rate": sampling_label
        }


preprocessing_service = PreprocessingService()