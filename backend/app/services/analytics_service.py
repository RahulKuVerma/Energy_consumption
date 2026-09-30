from typing import Dict, Any, List, Optional
import pandas as pd
from datetime import datetime
from backend.app.core.database import get_db_connection
from backend.app.services.system_settings_service import get_system_settings
from backend.app.utils.unit_converter import calculate_energy_cost, calculate_carbon_footprint_kg

class AnalyticsService:
    @staticmethod
    def get_summary_analytics(dataset_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Computes overall analytics, diurnal profile, and submetering breakdown
        from the database readings.
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = """
                SELECT timestamp, global_active_power, global_reactive_power, voltage, 
                       sub_metering_1, sub_metering_2, sub_metering_3, total_consumption_kwh
                FROM energy_readings
            """
            params = []
            if dataset_id:
                query += " WHERE dataset_id = ?"
                params.append(dataset_id)
            query += " ORDER BY timestamp ASC"

            cursor.execute(query, params)
            rows = cursor.fetchall()

        if not rows:
            return {
                "has_data": False,
                "total_consumption_kwh": None,
                "avg_hourly_kw": None,
                "peak_demand_kw": None,
                "peak_timestamp": None,
                "estimated_cost": None,
                "estimated_co2_kg": None,
                "submetering": None,
                "daily_trend": [],
                "hourly_profile": []
            }

        df = pd.DataFrame(rows)
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df["hour"] = df["timestamp"].dt.hour
        df["date"] = df["timestamp"].dt.date.astype(str)

        total_kwh = float(round(df["total_consumption_kwh"].sum(), 2))
        avg_kw = float(round(df["global_active_power"].mean(), 2))
        peak_row = df.loc[df["global_active_power"].idxmax()]
        peak_kw = float(round(peak_row["global_active_power"], 2))
        peak_ts = str(peak_row["timestamp"])

        # Submetering (Watt-hours to kWh)
        sub1_kwh = float(round(df["sub_metering_1"].sum() / 1000.0, 2))
        sub2_kwh = float(round(df["sub_metering_2"].sum() / 1000.0, 2))
        sub3_kwh = float(round(df["sub_metering_3"].sum() / 1000.0, 2))
        sub_total = sub1_kwh + sub2_kwh + sub3_kwh
        other_kwh = float(round(max(0, total_kwh - sub_total), 2))

        # Hourly diurnal profile
        hourly_grp = df.groupby("hour")["global_active_power"].mean().reset_index()
        hourly_profile = [
            {"hour": int(r["hour"]), "avg_kw": float(round(r["global_active_power"], 2))}
            for _, r in hourly_grp.iterrows()
        ]

        # Daily consumption trend
        daily_grp = df.groupby("date").agg({
            "total_consumption_kwh": "sum",
            "global_active_power": "max"
        }).reset_index()
        daily_trend = [
            {
                "date": str(r["date"]),
                "kwh": float(round(r["total_consumption_kwh"], 2)),
                "peak_kw": float(round(r["global_active_power"], 2))
            }
            for _, r in daily_grp.tail(30).iterrows()
        ]

        system_settings = get_system_settings()
        return {
            "has_data": True,
            "total_consumption_kwh": total_kwh,
            "avg_hourly_kw": avg_kw,
            "peak_demand_kw": peak_kw,
            "peak_timestamp": peak_ts,
            "estimated_cost": calculate_energy_cost(total_kwh, system_settings["kwh_rate"]),
            "estimated_co2_kg": calculate_carbon_footprint_kg(total_kwh, system_settings["co2_factor"]),
            "submetering": {
                "kitchen_kwh": sub1_kwh,
                "laundry_kwh": sub2_kwh,
                "climate_kwh": sub3_kwh,
                "other_kwh": other_kwh
            },
            "daily_trend": daily_trend,
            "hourly_profile": hourly_profile
        }

    @staticmethod
    def detect_anomalies(dataset_id: Optional[int] = None, z_threshold: Optional[float] = None) -> List[Dict[str, Any]]:
        """
        Detects power anomalies where active power deviates more than z_threshold from rolling mean.
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT timestamp, global_active_power, voltage FROM energy_readings"
            params = []
            if dataset_id:
                query += " WHERE dataset_id = ?"
                params.append(dataset_id)
            query += " ORDER BY timestamp ASC"
            cursor.execute(query, params)
            rows = cursor.fetchall()

        if not rows:
            return []

        threshold = z_threshold if z_threshold is not None else get_system_settings()["anomaly_zscore_threshold"]

        df = pd.DataFrame(rows)
        mean_val = df["global_active_power"].mean()
        std_val = df["global_active_power"].std()

        if std_val == 0:
            return []

        df["z_score"] = (df["global_active_power"] - mean_val) / std_val
        anomalies = df[df["z_score"].abs() >= threshold]

        results = []
        for _, row in anomalies.iterrows():
            results.append({
                "timestamp": str(row["timestamp"]),
                "global_active_power": float(row["global_active_power"]),
                "voltage": float(row["voltage"]),
                "z_score": float(round(row["z_score"], 2)),
                "type": "Spike" if row["z_score"] > 0 else "Sag"
            })

        return results

analytics_service = AnalyticsService()
