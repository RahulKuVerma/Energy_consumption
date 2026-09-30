from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.app.models.schemas import AlertItem, AlertCreate
from backend.app.services.alert_service import alert_service
from backend.app.core.database import get_db_connection

router = APIRouter()

@router.get("", response_model=List[AlertItem])
def list_alerts(
    resolved: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200)
):
    """Returns alerts with optional resolution status filter."""
    return alert_service.get_alerts(resolved=resolved, limit=limit)

@router.get("/summary")
def get_alerts_summary():
    """Returns count of active warnings, critical breaches, and total alerts."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM alerts WHERE is_resolved = 0")
        unresolved = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as critical FROM alerts WHERE is_resolved = 0 AND severity = 'critical'")
        critical = cursor.fetchone()["critical"]

        cursor.execute("SELECT COUNT(*) as warning FROM alerts WHERE is_resolved = 0 AND severity = 'warning'")
        warning = cursor.fetchone()["warning"]

        return {
            "unresolved_alerts": unresolved,
            "critical_count": critical,
            "warning_count": warning
        }

@router.post("", response_model=Dict[str, Any] if "Dict" in globals() else dict)
def create_alert(payload: AlertCreate):
    alert_id = alert_service.create_alert(
        alert_type=payload.alert_type,
        severity=payload.severity,
        title=payload.title,
        message=payload.message,
        metric_name=payload.metric_name,
        actual_value=payload.actual_value,
        threshold_value=payload.threshold_value,
        timestamp=payload.timestamp
    )
    return {"status": "success", "alert_id": alert_id}

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: int):
    success = alert_service.resolve_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found or already resolved")
    return {"status": "success", "message": f"Alert {alert_id} resolved"}
