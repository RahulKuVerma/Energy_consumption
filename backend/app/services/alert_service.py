from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.core.database import get_db_connection
from backend.app.services.system_settings_service import get_system_settings

class AlertService:
    @staticmethod
    def get_alerts(resolved: Optional[bool] = None, limit: int = 50) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM alerts"
            params = []
            if resolved is not None:
                query += " WHERE is_resolved = ?"
                params.append(1 if resolved else 0)
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)

            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def create_alert(
        alert_type: str,
        severity: str,
        title: str,
        message: str,
        metric_name: str = "global_active_power",
        actual_value: Optional[float] = None,
        threshold_value: Optional[float] = None,
        timestamp: Optional[str] = None
    ) -> int:
        if not timestamp:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO alerts (alert_type, severity, title, message, metric_name, actual_value, threshold_value, timestamp, is_resolved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
                """,
                (alert_type, severity, title, message, metric_name, actual_value, threshold_value, timestamp)
            )
            return cursor.lastrowid

    @staticmethod
    def resolve_alert(alert_id: int) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE alerts SET is_resolved = 1 WHERE id = ?", (alert_id,))
            return cursor.rowcount > 0

    @staticmethod
    def check_reading_for_alerts(reading: Dict[str, Any]) -> Optional[int]:
        """Scans a single real-time or batch reading and fires alert if thresholds violated."""
        power = float(reading.get("global_active_power", 0.0))
        voltage = float(reading.get("voltage", 230.0))
        ts = reading.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        system_settings = get_system_settings()

        if not system_settings["alerts_enabled"]:
            return None

        peak_threshold = system_settings["peak_threshold_kw"]
        if power >= peak_threshold:
            return AlertService.create_alert(
                alert_type="peak_load",
                severity="critical" if power > peak_threshold * 1.3 else "high",
                title="Critical Peak Load Threshold Exceeded",
                message=f"Current active demand of {power:.2f} kW exceeded threshold of {peak_threshold:.2f} kW.",
                metric_name="global_active_power",
                actual_value=power,
                threshold_value=peak_threshold,
                timestamp=ts
            )
        elif voltage < 210.0 or voltage > 255.0:
            return AlertService.create_alert(
                alert_type="voltage_deviation",
                severity="warning",
                title="Grid Voltage Anomaly",
                message=f"Grid voltage reading of {voltage:.1f} V breached stability envelope (210V - 255V).",
                metric_name="voltage",
                actual_value=voltage,
                threshold_value=230.0,
                timestamp=ts
            )
        return None

alert_service = AlertService()
