# Energy Consumption Forecasting Platform - REST API Documentation

## Base URL
```
http://localhost:8000/api
```

Interactive Swagger/OpenAPI documentation is available live at:
```
http://localhost:8000/docs
```

---

## 1. Data Ingestion & Upload Endpoints

### 1.1 Upload & Inspect File
* **Endpoint**: `POST /api/upload/file`
* **Content-Type**: `multipart/form-data`
* **Description**: Receives CSV, TXT, or Excel file, auto-detects delimiter (`;`, `,`, `\t`), validates headers, and extracts suggested column mappings.
* **Request**:
  * `file`: Binary file upload
* **Response**:
```json
{
  "status": "success",
  "message": "File uploaded and inspected successfully",
  "file_path": "./uploads/raw/household_sample.txt",
  "filename": "household_sample.txt",
  "file_size_bytes": 1048576,
  "detected_delimiter": ";",
  "columns": ["Date", "Time", "Global_active_power", "Voltage"],
  "suggested_mappings": {
    "date_col": "Date",
    "time_col": "Time",
    "global_active_power": "Global_active_power",
    "voltage": "Voltage"
  },
  "preview_rows": [
    {"Date": "28/09/2026", "Time": "12:00:00", "Global_active_power": 1.42, "Voltage": 234.5}
  ]
}
```

### 1.2 Confirm & Process Dataset
* **Endpoint**: `POST /api/upload/process`
* **Content-Type**: `application/x-www-form-urlencoded`
* **Parameters**:
  * `file_path`: Path to saved raw file
  * `dataset_name`: Name identifier for dataset
  * `column_mapping`: JSON string of confirmed column mapping
  * `resample_freq`: Resampling interval (`15min`, `1h`)
* **Response**:
```json
{
  "status": "success",
  "message": "Dataset processed and stored successfully",
  "data": {
    "dataset_id": 2,
    "name": "Smart Meter Zone A",
    "row_count": 2880,
    "sampling_rate": "15min"
  }
}
```

---

## 2. Dataset Endpoints

### 2.1 List Datasets
* **Endpoint**: `GET /api/datasets`
* **Response**: Array of dataset records with row count, dates, and sampling frequency.

### 2.2 Get Readings
* **Endpoint**: `GET /api/datasets/{dataset_id}/readings?page=1&page_size=50&sort=asc`
* **Response**: Paginated list of 15-minute / hourly energy readings for visualization.

---

## 3. Forecasting Endpoints

### 3.1 Execute Multi-Step Forecast
* **Endpoint**: `POST /api/forecast`
* **Body**:
```json
{
  "model_name": "xgboost",
  "horizon_hours": 24,
  "dataset_id": 1,
  "granularity": "hourly"
}
```
* **Response**:
```json
{
  "forecast_id": 12,
  "model_name": "xgboost",
  "horizon_hours": 24,
  "mean_forecast": 1.84,
  "peak_forecast": 3.72,
  "min_forecast": 0.45,
  "total_energy_kwh": 44.16,
  "forecast_items": [
    {
      "timestamp": "2026-09-30 00:00:00",
      "predicted_value": 0.85,
      "lower_bound": 0.62,
      "upper_bound": 1.08,
      "actual_value": null
    }
  ]
}
```

### 3.2 Quick Horizon Slider Forecast
* **Endpoint**: `GET /api/forecast/quick?model=xgboost&horizon=48`

---

## 4. ML Model Registry & Benchmarks

### 4.1 List Models & Metrics
* **Endpoint**: `GET /api/models`
* **Response**: Returns Linear Regression, XGBoost, and Deep LSTM records with MAE, RMSE, MAPE, $R^2$, and hyperparameters.

### 4.2 Model Scorecard Comparison
* **Endpoint**: `GET /api/models/compare`
* **Response**: Detailed comparison table ranking models by MAE, RMSE, inference latency (ms), and recommended deployment tier.

---

## 5. Analytics & Anomaly Detection

### 5.1 Analytics Summary
* **Endpoint**: `GET /api/analytics/summary?dataset_id=1`
* **Response**: Total consumption (kWh), average load (kW), peak demand (kW), estimated electricity cost ($), carbon emissions (kg CO2e), submetering breakdown, daily trend, and diurnal 24h curve.

### 5.2 Anomaly Scanner
* **Endpoint**: `GET /api/analytics/anomalies?threshold=2.5`
* **Response**: Array of historical readings violating statistical rolling Z-score threshold with anomaly type (Spike/Sag).

---

## 6. Alerts & Monitoring

### 6.1 List Alerts
* **Endpoint**: `GET /api/alerts?resolved=false&limit=20`

### 6.2 Resolve Alert
* **Endpoint**: `POST /api/alerts/{alert_id}/resolve`

---

## 7. Natural Language Query Engine

### 7.1 Process Question
* **Endpoint**: `POST /api/query`
* **Body**:
```json
{
  "query": "Predict electricity demand for the next 12 hours",
  "model_name": "xgboost"
}
```
* **Response**:
```json
{
  "query": "Predict electricity demand for the next 12 hours",
  "intent": "EXECUTE_FORECAST",
  "parameters": {"horizon_hours": 12, "model_name": "xgboost"},
  "numerical_result": {"mean_kw": 1.76, "peak_kw": 3.42, "total_kwh": 21.12},
  "explanation": "Using the XGBOOST model for the next 12 hours: predicted average demand is 1.76 kW, with an anticipated peak of 3.42 kW, amounting to an estimated 21.12 kWh total consumption.",
  "chart_data": [...]
}
```
