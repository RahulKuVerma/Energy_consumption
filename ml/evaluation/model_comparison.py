from typing import List, Dict, Any
import pandas as pd
import numpy as np

def generate_comparison_table(evaluations: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Takes multiple evaluation reports and generates a clean comparative scorecard.
    Ranked by lowest MAE / RMSE and highest R2 score.
    """
    rows = []
    for ev in evaluations:
        m = ev["metrics"]
        rows.append({
            "Model": ev["model_name"],
            "MAE (kW)": m["mae"],
            "RMSE (kW)": m["rmse"],
            "MAPE (%)": f"{m['mape']}%",
            "R² Score": m["r2_score"],
            "Directional Acc (%)": f"{m['mda_percent']}%",
            "Residual Std": ev.get("residuals", {}).get("std", "N/A")
        })

    df = pd.DataFrame(rows).sort_values("MAE (kW)").reset_index(drop=True)
    return df
