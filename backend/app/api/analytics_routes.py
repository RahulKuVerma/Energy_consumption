from fastapi import APIRouter, Query
from typing import Optional
from backend.app.services.analytics_service import analytics_service

router = APIRouter()

@router.get("/summary")
def get_analytics_summary(dataset_id: Optional[int] = None):
    """Returns aggregated energy analytics, diurnal profiles, cost, and emissions."""
    return analytics_service.get_summary_analytics(dataset_id)

@router.get("/anomalies")
def get_anomalies(
    dataset_id: Optional[int] = None,
    threshold: Optional[float] = Query(None, ge=1.0, le=5.0)
):
    """Returns detected consumption anomalies exceeding statistical z-score."""
    return analytics_service.detect_anomalies(dataset_id, z_threshold=threshold)
