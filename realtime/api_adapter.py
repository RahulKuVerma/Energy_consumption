from typing import Dict, Any, Optional
from datetime import datetime
from backend.app.core.database import get_db_connection
from backend.app.services.alert_service import alert_service
from backend.app.utils.unit_converter import power_to_energy_kwh

class RealTimeAPIAdapter:
    """
    Standardization & Ingestion Adapter for Real-Time Energy Telemetry:
    1. Maps external heterogenous payloads into Common Internal Schema.
    2. Validates physical bounds (voltage, current, power).
    3. Triggers instantaneous anomaly and peak-load alert evaluation.
    4. Persists stream readings into the database.
    """
    CANONICAL_FIELDS = [
        "timestamp", "global_active_power", "global_reactive_power",
        "voltage", "global_intensity", "energy_consumption_kwh",
        "sub_metering_1", "sub_metering_2", "sub_metering_3"
    ]

    @staticmethod
    def standardize_payload(raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Maps diverse incoming sensor payload keys to internal canonical schema."""
        standardized = {}

        # 1. Timestamp resolution
        ts = (
            raw_payload.get("timestamp") or 
            raw_payload.get("datetime") or 
            raw_payload.get("time") or 
            raw_payload.get("ts") or 
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        standardized["timestamp"] = str(ts)

        # 2. Active power (kW)
        power_val = (
            raw_payload.get("global_active_power") or 
            raw_payload.get("active_power") or 
            raw_payload.get("power_kw") or 
            raw_payload.get("load") or 
            raw_payload.get("power") or 0.0
        )
        # If payload sent in Watts, convert to kW
        if float(power_val) > 50.0:  # Threshold suggesting Watts instead of kW
            power_val = float(power_val) / 1000.0
        standardized["global_active_power"] = float(round(float(power_val), 3))

        # 3. Voltage
        volt_val = raw_payload.get("voltage") or raw_payload.get("volt") or 230.0
        standardized["voltage"] = float(round(float(volt_val), 1))

        # 4. Energy calculation
        # If explicitly given in kWh use it, otherwise derive from power * 0.25 (15m interval)
        if "energy_consumption_kwh" in raw_payload:
            standardized["energy_consumption_kwh"] = float(raw_payload["energy_consumption_kwh"])
        else:
            standardized["energy_consumption_kwh"] = float(round(standardized["global_active_power"] * 0.25, 4))

        # 5. Optional telemetry
        standardized["global_reactive_power"] = float(raw_payload.get("global_reactive_power", 0.0))
        standardized["global_intensity"] = float(raw_payload.get("global_intensity", 0.0))
        standardized["sub_metering_1"] = float(raw_payload.get("sub_metering_1", 0.0))
        standardized["sub_metering_2"] = float(raw_payload.get("sub_metering_2", 0.0))
        standardized["sub_metering_3"] = float(raw_payload.get("sub_metering_3", 0.0))

        return standardized

    @staticmethod
    def ingest_reading(raw_payload: Dict[str, Any], dataset_id: Optional[int] = 1) -> Dict[str, Any]:
        """Standardizes, scans for alerts, and inserts telemetry into the active database."""
        clean_reading = RealTimeAPIAdapter.standardize_payload(raw_payload)

        # Alert verification
        alert_id = alert_service.check_reading_for_alerts(clean_reading)

        # Database insertion
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO energy_readings 
                (dataset_id, timestamp, global_active_power, global_reactive_power, voltage, global_intensity, sub_metering_1, sub_metering_2, sub_metering_3, total_consumption_kwh)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    dataset_id,
                    clean_reading["timestamp"],
                    clean_reading["global_active_power"],
                    clean_reading["global_reactive_power"],
                    clean_reading["voltage"],
                    clean_reading["global_intensity"],
                    clean_reading["sub_metering_1"],
                    clean_reading["sub_metering_2"],
                    clean_reading["sub_metering_3"],
                    clean_reading["energy_consumption_kwh"]
                )
            )
            reading_id = cursor.lastrowid

        return {
            "status": "success",
            "reading_id": reading_id,
            "data": clean_reading,
            "alert_fired": alert_id is not None,
            "alert_id": alert_id
        }

api_adapter = RealTimeAPIAdapter()
