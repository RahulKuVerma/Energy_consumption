from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import DatasetResponse, ReadingsQueryResponse, EnergyReadingItem
from backend.app.core.auth import get_current_user, require_admin

router = APIRouter()

@router.get("", response_model=List[DatasetResponse])
def list_datasets(user=Depends(get_current_user)):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user["role"] == "admin":
            cursor.execute("SELECT d.*, u.username AS uploaded_by FROM datasets d LEFT JOIN users u ON u.id = d.owner_id ORDER BY d.created_at DESC")
        else:
            cursor.execute("SELECT * FROM datasets WHERE owner_id = ? ORDER BY created_at DESC", (user["id"],))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, user=Depends(get_current_user)):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user["role"] == "admin":
            cursor.execute("SELECT d.*, u.username AS uploaded_by FROM datasets d LEFT JOIN users u ON u.id = d.owner_id WHERE d.id = ?", (dataset_id,))
        else:
            cursor.execute("SELECT * FROM datasets WHERE id = ? AND owner_id = ?", (dataset_id, user["id"]))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return dict(row)

@router.get("/{dataset_id}/readings", response_model=ReadingsQueryResponse)
def get_dataset_readings(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    sort: str = Query("asc", pattern="^(asc|desc)$"),
    user=Depends(get_current_user),
):
    offset = (page - 1) * page_size
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT owner_id FROM datasets WHERE id = ?", (dataset_id,))
        dataset = cursor.fetchone()
        if not dataset or (user["role"] != "admin" and dataset["owner_id"] != user["id"]):
            raise HTTPException(status_code=404, detail="Dataset not found")
        cursor.execute("SELECT COUNT(*) as cnt FROM energy_readings WHERE dataset_id = ?", (dataset_id,))
        total_count = cursor.fetchone()["cnt"]

        cursor.execute(
            f"""
            SELECT * FROM energy_readings 
            WHERE dataset_id = ? 
            ORDER BY timestamp {sort.upper()} 
            LIMIT ? OFFSET ?
            """,
            (dataset_id, page_size, offset)
        )
        rows = cursor.fetchall()
        return {
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "readings": [dict(r) for r in rows]
        }

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: int, _admin=Depends(require_admin)):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return {"status": "success", "message": f"Dataset {dataset_id} deleted."}
