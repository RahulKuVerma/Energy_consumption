from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.app.core.database import get_db_connection
from backend.app.models.schemas import DatasetResponse, ReadingsQueryResponse, EnergyReadingItem

router = APIRouter()

@router.get("", response_model=List[DatasetResponse])
def list_datasets():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM datasets ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return dict(row)

@router.get("/{dataset_id}/readings", response_model=ReadingsQueryResponse)
def get_dataset_readings(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    sort: str = Query("asc", pattern="^(asc|desc)$")
):
    offset = (page - 1) * page_size
    with get_db_connection() as conn:
        cursor = conn.cursor()
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
def delete_dataset(dataset_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return {"status": "success", "message": f"Dataset {dataset_id} deleted."}
