import os
import secrets
from pathlib import Path

# Fallback handling across Pydantic v2, v1, and standard Python
try:
    # pyrefly: ignore [missing-import]
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        class BaseSettings:
            pass

# Resolve base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = BASE_DIR / "backend"
UPLOAD_DIR = BASE_DIR / "uploads"
ML_DIR = BASE_DIR / "ml"
DATABASE_DIR = BASE_DIR / "database"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Energy Consumption Forecasting API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    
    # Database
    DATABASE_PATH: Path = DATABASE_DIR / "energy_forecasting.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}")
    
    # Storage Paths & Uploads
    RAW_UPLOAD_DIR: Path = UPLOAD_DIR / "raw"
    PROCESSED_UPLOAD_DIR: Path = UPLOAD_DIR / "processed"
    TEMP_UPLOAD_DIR: Path = UPLOAD_DIR / "temporary"
    ALLOWED_EXTENSIONS: set = {"csv", "xlsx", "txt"}
    
    # ML Models
    MODEL_DIR: Path = ML_DIR / "saved_models"
    DATA_RAW_DIR: Path = ML_DIR / "data" / "raw"
    DATA_PROCESSED_DIR: Path = ML_DIR / "data" / "processed"
    
    # Defaults & Alerts
    DEFAULT_FORECAST_HORIZON: int = int(os.getenv("FORECAST_HORIZON_DEFAULT", "24"))
    PEAK_ALERT_THRESHOLD_KW: float = float(os.getenv("PEAK_ALERT_THRESHOLD_KW", "4.5"))
    ANOMALY_ZSCORE_THRESHOLD: float = float(os.getenv("ANOMALY_ZSCORE_THRESHOLD", "2.5"))
    KWH_COST_RATE: float = float(os.getenv("KWH_RATE", "0.18"))
    
    # Allowed CORS Origins
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()

# Ensure directories exist
for path in [
    settings.RAW_UPLOAD_DIR,
    settings.PROCESSED_UPLOAD_DIR,
    settings.TEMP_UPLOAD_DIR,
    settings.MODEL_DIR,
    settings.DATA_RAW_DIR,
    settings.DATA_PROCESSED_DIR,
    DATABASE_DIR,
]:
    path.mkdir(parents=True, exist_ok=True)