from fastapi import APIRouter
from backend.app.api.upload_routes import router as upload_router
from backend.app.api.forecast_routes import router as forecast_router
from backend.app.api.model_routes import router as model_router
from backend.app.api.dataset_routes import router as dataset_router
from backend.app.api.analytics_routes import router as analytics_router
from backend.app.api.alert_routes import router as alert_router
from backend.app.api.query_routes import router as query_router
from backend.app.api.settings_routes import router as settings_router

api_router = APIRouter()

api_router.include_router(upload_router, prefix="/upload", tags=["Upload & Ingestion"])
api_router.include_router(dataset_router, prefix="/datasets", tags=["Datasets"])
api_router.include_router(forecast_router, prefix="/forecast", tags=["Forecasting"])
api_router.include_router(model_router, prefix="/models", tags=["ML Models"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics & Insights"])
api_router.include_router(alert_router, prefix="/alerts", tags=["Alerts & Monitoring"])
api_router.include_router(query_router, prefix="/query", tags=["Natural Language Query"])
api_router.include_router(settings_router, prefix="/settings", tags=["Settings"])
