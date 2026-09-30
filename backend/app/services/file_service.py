import os
import shutil
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import pandas as pd
from backend.app.core.config import settings
from backend.app.utils.validators import validate_file_extension, validate_dataframe_content
from backend.app.utils.column_mapper import detect_column_mappings

class FileService:
    @staticmethod
    def save_upload_file(file_contents: bytes, filename: str) -> Path:
        """Saves uploaded raw bytes into uploads/raw directory."""
        target_dir = settings.RAW_UPLOAD_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        dest_path = target_dir / filename
        
        # If file exists, append timestamp or counter
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            import time
            dest_path = target_dir / f"{stem}_{int(time.time())}{suffix}"
            
        with open(dest_path, "wb") as f:
            f.write(file_contents)
            
        return dest_path

    @staticmethod
    def read_dataset_sample(file_path: Path, max_rows: int = 100) -> Tuple[pd.DataFrame, str]:
        """
        Reads a sample of the dataset with auto-detected delimiter (; , \t).
        Returns DataFrame sample and detected separator.
        """
        ext = file_path.suffix.lower()
        if ext == ".xlsx":
            df = pd.read_excel(file_path, nrows=max_rows)
            return df, "excel"
            
        # For text / csv, detect delimiter by inspecting first few lines
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            first_lines = [f.readline() for _ in range(5)]
            sample_text = "".join(first_lines)
            
        sep = ","
        if ";" in sample_text and sample_text.count(";") > sample_text.count(","):
            sep = ";"
        elif "\t" in sample_text and sample_text.count("\t") > sample_text.count(","):
            sep = "\t"
            
        df = pd.read_csv(
            file_path,
            sep=sep,
            nrows=max_rows,
            low_memory=False,
            na_values=["?", "NA", "null", "NaN", ""]
        )
        return df, sep

    @staticmethod
    def inspect_file(file_path: Path) -> Dict[str, Any]:
        """
        Inspects file, detects column mappings, row preview, and basic stats.
        """
        df_sample, sep = FileService.read_dataset_sample(file_path, max_rows=100)
        mappings = detect_column_mappings(list(df_sample.columns))
        
        preview_rows = df_sample.head(10).fillna("").to_dict(orient="records")
        
        return {
            "filename": file_path.name,
            "file_size_bytes": file_path.stat().st_size,
            "detected_delimiter": sep,
            "columns": list(df_sample.columns),
            "suggested_mappings": mappings,
            "preview_rows": preview_rows,
            "sample_row_count": len(df_sample)
        }

file_service = FileService()
