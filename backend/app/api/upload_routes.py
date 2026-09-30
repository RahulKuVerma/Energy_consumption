import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, Dict
from backend.app.services.file_service import file_service
from backend.app.services.preprocessing_service import preprocessing_service
from backend.app.utils.validators import validate_file_extension

router = APIRouter()

@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    """
    Step 1 of Ingestion:
    Receives file, verifies extension, saves raw content, auto-detects delimiter
    and suggests column mappings for preview.
    """
    is_valid, err_msg = validate_file_extension(file.filename)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    saved_path = file_service.save_upload_file(contents, file.filename)
    inspection_result = file_service.inspect_file(saved_path)
    
    return {
        "status": "success",
        "message": "File uploaded and inspected successfully",
        "file_path": str(saved_path),
        **inspection_result
    }

@router.post("/process")
async def process_dataset(
    file_path: str = Form(...),
    dataset_name: str = Form(...),
    column_mapping: str = Form(...),  # JSON string
    resample_freq: str = Form("1h")
):
    """
    Step 2 of Ingestion:
    Applies user-confirmed column mapping, cleans data, resamples to hourly,
    and inserts into database readings.
    """
    try:
        mapping = json.loads(column_mapping)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON mapping: {str(e)}")

    from pathlib import Path
    path_obj = Path(file_path)
    if not path_obj.exists():
        raise HTTPException(status_code=404, detail="Uploaded file not found on server.")

    try:
        result = preprocessing_service.process_and_store_dataset(
            file_path=path_obj,
            mapping=mapping,
            dataset_name=dataset_name,
            resample_freq=resample_freq
        )
        return {
            "status": "success",
            "message": "Dataset processed and stored successfully",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing dataset: {str(e)}")
