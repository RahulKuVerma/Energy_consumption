import sys
from pathlib import Path
import pytest

# Add project root to sys.path for test discovery
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def admin_client():
    with TestClient(app) as client:
        response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert response.status_code == 200
        client.headers.update({"Authorization": f"Bearer {response.json()['access_token']}"})
        yield client
