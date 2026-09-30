-- Energy Consumption Forecasting Database Schema
-- Compatible with SQLite3 and PostgreSQL

CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER DEFAULT 0,
    row_count INTEGER DEFAULT 0,
    sampling_rate VARCHAR(50) DEFAULT '1 Hour',
    start_timestamp TIMESTAMP,
    end_timestamp TIMESTAMP,
    status VARCHAR(50) DEFAULT 'processed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS energy_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER,
    timestamp TIMESTAMP NOT NULL,
    global_active_power REAL,       -- in kW
    global_reactive_power REAL,     -- in kW
    voltage REAL,                   -- in Volts
    global_intensity REAL,          -- in Amperes
    sub_metering_1 REAL DEFAULT 0,  -- Kitchen (watt-hours)
    sub_metering_2 REAL DEFAULT 0,  -- Laundry room (watt-hours)
    sub_metering_3 REAL DEFAULT 0,  -- Climate control (watt-hours)
    total_consumption_kwh REAL,     -- Aggregated calculated energy
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON energy_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_readings_dataset ON energy_readings(dataset_id);

CREATE TABLE IF NOT EXISTS ml_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- 'linear_regression', 'xgboost', 'lstm'
    version VARCHAR(20) DEFAULT '1.0.0',
    file_path TEXT NOT NULL,
    scaler_path TEXT,
    mae REAL,
    rmse REAL,
    mape REAL,
    r2_score REAL,
    hyperparameters TEXT, -- JSON string
    is_active BOOLEAN DEFAULT 1,
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER,
    model_id INTEGER,
    model_name VARCHAR(100) NOT NULL,
    horizon_hours INTEGER NOT NULL DEFAULT 24,
    granularity VARCHAR(20) DEFAULT 'hourly',
    mean_forecast REAL,
    peak_forecast REAL,
    min_forecast REAL,
    total_energy_kwh REAL,
    metrics_summary TEXT, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE SET NULL,
    FOREIGN KEY (model_id) REFERENCES ml_models(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS forecast_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    forecast_id INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    predicted_value REAL NOT NULL,
    lower_bound REAL,
    upper_bound REAL,
    actual_value REAL,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_forecast_items_forecast ON forecast_items(forecast_id);
CREATE INDEX IF NOT EXISTS idx_forecast_items_timestamp ON forecast_items(timestamp);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type VARCHAR(50) NOT NULL, -- 'peak_load', 'anomaly', 'voltage_deviation', 'threshold_breach'
    severity VARCHAR(20) NOT NULL,   -- 'info', 'warning', 'high', 'critical'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metric_name VARCHAR(100) DEFAULT 'global_active_power',
    actual_value REAL,
    threshold_value REAL,
    timestamp TIMESTAMP NOT NULL,
    is_resolved BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
