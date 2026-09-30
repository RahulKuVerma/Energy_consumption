import pandas as pd
import numpy as np
from typing import List, Tuple

def create_time_series_features(df: pd.DataFrame, target_col: str = "Global_active_power") -> pd.DataFrame:
    """
    Generates rich time-series predictive features:
    1. Temporal calendar features (hour, day of week, month, weekend flag)
    2. Cyclical trigonometric sine/cosine encodings
    3. Autoregressive lag features (1h, 2h, 3h, 24h, 168h)
    4. Rolling window moving averages and volatility (6h, 24h)
    """
    df_feat = df.copy()
    if not isinstance(df_feat.index, pd.DatetimeIndex):
        raise ValueError("DataFrame index must be DatetimeIndex to extract temporal features.")

    # 1. Calendar Features
    df_feat["hour"] = df_feat.index.hour
    df_feat["dayofweek"] = df_feat.index.dayofweek
    df_feat["quarter"] = df_feat.index.quarter
    df_feat["month"] = df_feat.index.month
    df_feat["year"] = df_feat.index.year
    df_feat["dayofyear"] = df_feat.index.dayofyear
    df_feat["is_weekend"] = df_feat["dayofweek"].isin([5, 6]).astype(int)

    # 2. Cyclical Encoding (ensures hour 23 and hour 0 are close)
    df_feat["hour_sin"] = np.sin(2 * np.pi * df_feat["hour"] / 24.0)
    df_feat["hour_cos"] = np.cos(2 * np.pi * df_feat["hour"] / 24.0)
    df_feat["dayofweek_sin"] = np.sin(2 * np.pi * df_feat["dayofweek"] / 7.0)
    df_feat["dayofweek_cos"] = np.cos(2 * np.pi * df_feat["dayofweek"] / 7.0)

    # 3. Autoregressive Lags
    if target_col in df_feat.columns:
        df_feat["lag_1"] = df_feat[target_col].shift(1)
        df_feat["lag_2"] = df_feat[target_col].shift(2)
        df_feat["lag_3"] = df_feat[target_col].shift(3)
        df_feat["lag_24"] = df_feat[target_col].shift(24)  # Previous day same hour
        df_feat["lag_168"] = df_feat[target_col].shift(168) # Previous week same hour

        # 4. Rolling Window Statistics
        df_feat["rolling_mean_6h"] = df_feat[target_col].shift(1).rolling(window=6).mean()
        df_feat["rolling_mean_24h"] = df_feat[target_col].shift(1).rolling(window=24).mean()
        df_feat["rolling_std_24h"] = df_feat[target_col].shift(1).rolling(window=24).std()

    # Drop initial NaN rows created by lags
    df_feat = df_feat.dropna()
    return df_feat

def chronological_train_test_split(
    df: pd.DataFrame, 
    test_size: float = 0.2
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    CRITICAL Time-Series Best Practice:
    Strict chronological split without random shuffling to avoid data leakage.
    """
    split_idx = int(len(df) * (1 - test_size))
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    return train_df, test_df
