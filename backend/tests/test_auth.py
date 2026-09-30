import uuid

from fastapi.testclient import TestClient

from backend.app.core.database import get_db_connection
from backend.main import app


def test_authentication_dataset_ownership_and_publication(admin_client):
    anonymous = TestClient(app)
    assert anonymous.get("/api/models").status_code == 401

    username = f"user_{uuid.uuid4().hex[:10]}"
    registered = admin_client.post(
        "/api/auth/register",
        json={"username": username, "password": "test-password-123"},
    )
    assert registered.status_code == 200
    token = registered.json()["access_token"]
    user_client = TestClient(app)
    user_client.headers.update({"Authorization": f"Bearer {token}"})

    with get_db_connection() as conn:
        user_id = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()["id"]
        cursor = conn.execute(
            "INSERT INTO datasets (name, filename, file_path, owner_id) VALUES (?, ?, ?, ?)",
            ("Private test dataset", "private.csv", "uploads/processed/private.csv", user_id),
        )
        dataset_id = cursor.lastrowid
        model_id = conn.execute("SELECT id FROM ml_models ORDER BY id LIMIT 1").fetchone()["id"]
        prior_publication = conn.execute("SELECT is_published FROM ml_models WHERE id = ?", (model_id,)).fetchone()["is_published"]

    try:
        own_datasets = user_client.get("/api/datasets").json()
        assert any(dataset["id"] == dataset_id for dataset in own_datasets)
        assert user_client.get(f"/api/datasets/{dataset_id}").status_code == 200
        assert user_client.get("/api/models").json() == []
        assert user_client.put(f"/api/models/{model_id}/publication", json={"is_published": True}).status_code == 403

        published = admin_client.put(
            f"/api/models/{model_id}/publication",
            json={"is_published": True},
        )
        assert published.status_code == 200
        assert any(model["id"] == model_id for model in user_client.get("/api/models").json())

        unpublished = admin_client.put(
            f"/api/models/{model_id}/publication",
            json={"is_published": False},
        )
        assert unpublished.status_code == 200
        assert all(model["id"] != model_id for model in user_client.get("/api/models").json())
    finally:
        with get_db_connection() as conn:
            conn.execute("UPDATE ml_models SET is_published = ? WHERE id = ?", (prior_publication, model_id))
            conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))