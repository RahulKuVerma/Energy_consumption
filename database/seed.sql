-- Initial system settings and baseline models seed data

INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
('peak_threshold_kw', '4.5', 'Alert threshold for peak active power consumption in kW'),
('anomaly_zscore_threshold', '2.5', 'Statistical z-score boundary for anomaly detection'),
('default_forecast_model', 'xgboost', 'Default model selected for dashboard forecasts'),
('default_horizon_hours', '24', 'Standard forecasting horizon in hours'),
('currency_symbol', '$', 'Currency symbol for energy cost estimation'),
('kwh_rate', '0.18', 'Cost per kilowatt-hour for financial analytics'),
('simulator_active', '1', 'Flag to indicate whether live stream simulator is enabled');

INSERT OR IGNORE INTO ml_models (id, name, model_type, version, file_path, scaler_path, mae, rmse, mape, r2_score, hyperparameters, is_active) VALUES
(1, 'Baseline Linear Regression', 'linear_regression', '1.0.0', 'ml/saved_models/linear_regression.pkl', 'ml/saved_models/scaler.pkl', 0.285, 0.412, 14.8, 0.742, '{"fit_intercept": true, "lags": [1, 2, 24, 168]}', 1),
(2, 'Gradient Boosted Trees (XGBoost)', 'xgboost', '1.2.0', 'ml/saved_models/xgboost_model.json', 'ml/saved_models/scaler.pkl', 0.174, 0.268, 8.4, 0.891, '{"n_estimators": 200, "max_depth": 6, "learning_rate": 0.05, "subsample": 0.8}', 1),
(3, 'Deep Recurrent LSTM Network', 'lstm', '2.0.0', 'ml/saved_models/lstm_model.keras', 'ml/saved_models/scaler.pkl', 0.158, 0.245, 7.6, 0.915, '{"layers": [64, 32], "lookback": 24, "epochs": 50, "batch_size": 32, "dropout": 0.2}', 1);

INSERT OR IGNORE INTO alerts (id, alert_type, severity, title, message, metric_name, actual_value, threshold_value, timestamp, is_resolved) VALUES
(1, 'peak_load', 'warning', 'High Energy Demand Detected', 'Active power exceeded the warning threshold of 4.2 kW during evening peak hours.', 'global_active_power', 4.82, 4.20, '2026-09-28 19:30:00', 1),
(2, 'anomaly', 'high', 'Unusual Consumption Spike', 'Sub-metering 3 (HVAC/Climate) exhibited a statistically significant anomaly (+3.1 std dev).', 'sub_metering_3', 28.4, 15.0, '2026-09-29 03:15:00', 0),
(3, 'voltage_deviation', 'info', 'Grid Voltage Dip', 'Voltage momentarily dipped to 231.4V, within allowable operating tolerance.', 'voltage', 231.4, 230.0, '2026-09-29 08:45:00', 0);
