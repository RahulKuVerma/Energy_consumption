import os
from typing import Tuple, List, Dict, Any
import pandas as pd

ALLOWED_EXTENSIONS = {".csv", ".txt", ".tsv", ".xlsx"}
MAX_FILE_SIZE_MB = 100

REQUIRED_CORE_CONCEPTS = ["timestamp", "global_active_power"]

def validate_file_extension(filename: str) -> Tuple[bool, str]:
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file extension '{ext}'. Allowed extensions are: {', '.join(ALLOWED_EXTENSIONS)}"
    return True, ""

def validate_dataframe_content(df: pd.DataFrame) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Validates a loaded DataFrame for minimum row count, presence of time and power columns,
    and missing value percentages.
    """
    errors = []
    stats = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": list(df.columns),
        "null_counts": df.isnull().sum().to_dict(),
        "memory_mb": round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
    }

    if len(df) < 5:
        errors.append("Dataset must contain at least 5 rows for time series processing.")

    # Check for empty columns
    all_null_cols = [col for col, count in stats["null_counts"].items() if count == len(df)]
    if all_null_cols:
        errors.append(f"Columns contain only null values: {', '.join(all_null_cols)}")

    is_valid = len(errors) == 0
    return is_valid, errors, stats
