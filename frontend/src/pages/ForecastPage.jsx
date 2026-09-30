import React, { useState, useCallback, useEffect } from 'react';
import { Play, TrendingUp, Clock, Zap, BarChart2, Info } from 'lucide-react';
import { api } from '../services/api.js';
import ForecastChart from '../components/ForecastChart.jsx';
import Loading from '../components/Loading.jsx';
import { formatPower, formatEnergy, formatCurrency, formatDateTime } from '../utils/formatters.js';

const MODEL_INFO = {
  linear_regression: {
    label: 'Linear Regression',
    color: 'var(--electric-cyan)',
    desc: 'Interpretable baseline with lag features & calendar encoding. Ultra-fast inference (~1ms).',
    strengths: ['Maximum interpretability', 'Near-zero latency', 'Stable predictions'],
  },
  xgboost: {
    label: 'XGBoost',
    color: 'var(--electric-blue)',
    desc: 'Gradient-boosted trees capturing non-linear load patterns & feature interactions.',
    strengths: ['Best accuracy (MAE ~0.17 kW)', 'Robust to outliers', 'Feature importance'],
    recommended: true,
  },
  lstm: {
    label: 'LSTM Neural Net',
    color: 'var(--deep-purple)',
    desc: 'Long Short-Term Memory RNN with 48-step sequence input. Best for multi-day horizons.',
    strengths: ['Long-range dependency capture', 'Learns diurnal & weekly cycles', 'Narrows CI over time'],
  },
};

const HORIZON_OPTIONS = [
  { label: '6 Hours', value: 6 },
  { label: '12 Hours', value: 12 },
  { label: '24 Hours', value: 24 },
  { label: '48 Hours', value: 48 },
  { label: '72 Hours', value: 72 },
  { label: '7 Days', value: 168 },
];

export default function ForecastPage({ selectedDatasetId, activeDataset, selectedModel, settings, onSelectModel, userRole, onOpenDatasets }) {
  const [model, setModel] = useState(selectedModel || 'xgboost');
  const [horizon, setHorizon] = useState(settings.default_horizon);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);

  useEffect(() => {
    api.getModels()
      .then((models) => setAvailableModels(Array.isArray(models) ? models : []))
      .catch((err) => setError(err.message || 'Could not load available models.'));
  }, []);

  useEffect(() => {
    if (!availableModels.length || availableModels.some((item) => item.model_type === model)) return;
    const nextModel = availableModels[0].model_type;
    setModel(nextModel);
    onSelectModel(nextModel);
  }, [availableModels, model, onSelectModel]);

  const handleModelChange = (m) => {
    setModel(m);
    onSelectModel(m);
  };

  const runForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.createForecast(model, horizon, selectedDatasetId);
      setForecast(result);
    } catch (err) {
      setError(err.message || 'Forecast failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [model, horizon, selectedDatasetId]);

  const loadHistory = async () => {
    if (historyLoaded) return;
    try {
      const h = await api.getForecastHistory();
      setHistory(Array.isArray(h) ? h : []);
      setHistoryLoaded(true);
    } catch (_) {}
  };

  const modelInfo = MODEL_INFO[model];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
          Forecast Studio
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Data source: {activeDataset?.name || (userRole === 'admin' ? 'All datasets' : 'No dataset selected')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Control Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Model Selection */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ML Model
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {Object.entries(MODEL_INFO).filter(([key]) => availableModels.some((item) => item.model_type === key)).map(([key, info]) => (
                <button
                  key={key}
                  id={`model-btn-${key}`}
                  onClick={() => handleModelChange(key)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: model === key ? `1px solid ${info.color}60` : '1px solid var(--border-subtle)',
                    background: model === key ? `${info.color}12` : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: model === key ? info.color : 'var(--text-primary)' }}>
                      {info.label}
                    </span>
                    {info.recommended && (
                      <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>⭐ Recommended</span>
                    )}
                  </div>
                </button>
              ))}
              {!availableModels.length && !error && <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No published models are available yet.</p>}
            </div>
          </div>

          {/* Horizon Selection */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Forecast Horizon
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {HORIZON_OPTIONS.map((h) => (
                <button
                  key={h.value}
                  id={`horizon-btn-${h.value}`}
                  onClick={() => setHorizon(h.value)}
                  className={`btn ${horizon === h.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.5rem 0.5rem' }}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Info Card */}
          {modelInfo && (
            <div className="glass-card" style={{ padding: '1.25rem', borderColor: `${modelInfo.color}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Info size={15} color={modelInfo.color} />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: modelInfo.color }}>
                  {modelInfo.label}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                {modelInfo.desc}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {modelInfo.strengths.map((s) => (
                  <li key={s} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem' }}>
                    <span style={{ color: modelInfo.color }}>✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Run Button */}
          <button
            id="run-forecast-btn"
            onClick={runForecast}
            disabled={loading || (userRole !== 'admin' && !selectedDatasetId) || !availableModels.some((item) => item.model_type === model)}
            className="btn btn-primary"
            style={{ padding: '1rem', fontSize: '1rem', width: '100%' }}
          >
            {loading ? (
              <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙</span> Generating...</>
            ) : (
              <><Play size={18} /> Run Forecast</>
            )}
          </button>
          {userRole !== 'admin' && !selectedDatasetId && <button type="button" onClick={onOpenDatasets} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            Choose a dataset
          </button>}
        </div>

        {/* Right: Chart + Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Chart */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <TrendingUp size={20} color={modelInfo?.color || 'var(--electric-blue)'} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>
                    {forecast ? `${horizon}h Forecast — ${MODEL_INFO[model]?.label}` : 'Forecast Output'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {forecast
                      ? `Generated at ${formatDateTime(forecast.created_at)} · 95% confidence interval`
                      : 'Select model and horizon, then press Run Forecast'}
                  </p>
                </div>
              </div>
              {forecast && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[
                    { label: 'Mean', val: formatPower(forecast.mean_forecast), color: 'var(--electric-blue)' },
                    { label: 'Peak', val: formatPower(forecast.peak_forecast), color: 'var(--energy-amber)' },
                    { label: 'Total', val: formatEnergy(forecast.total_energy_kwh), color: 'var(--eco-emerald)' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{
                padding: '1rem', borderRadius: 'var(--radius-md)',
                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                color: 'var(--alert-rose)', fontSize: '0.85rem', marginBottom: '1rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            {loading ? (
              <Loading message="Running forecast model..." />
            ) : (
              <ForecastChart forecastItems={forecast?.forecast_items || []} height={340} />
            )}
          </div>

          {/* Forecast Detail Table */}
          {forecast && forecast.forecast_items && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                <BarChart2 size={18} color="var(--text-muted)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Forecast Data Table</h3>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
                    <tr style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left' }}>Timestamp</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Predicted</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Lower 95%</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Upper 95%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.forecast_items.map((item, idx) => (
                      <tr key={idx} style={{
                        borderTop: '1px solid rgba(255,255,255,0.03)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                      }}>
                        <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                          {formatDateTime(item.timestamp)}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '700', color: 'var(--electric-cyan)', fontFamily: 'var(--font-mono)' }}>
                          {formatPower(item.predicted_value)}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {formatPower(item.lower_bound)}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {formatPower(item.upper_bound)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
