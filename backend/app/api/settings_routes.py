from fastapi import APIRouter
from backend.app.models.schemas import SystemSettings
from backend.app.services.system_settings_service import get_system_settings, update_system_settings

router = APIRouter()


@router.get("", response_model=SystemSettings)
def read_settings():
    return get_system_settings()


@router.put("", response_model=SystemSettings)
def save_settings(payload: SystemSettings):
    return update_system_settings(payload)