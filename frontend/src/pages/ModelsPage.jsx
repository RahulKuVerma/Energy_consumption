import React, { useState, useEffect } from 'react';
import { Cpu, Award, RefreshCw, BarChart2, Play } from 'lucide-react';
import { api } from '../services/api.js';
import ModelMetrics from '../components/ModelMetrics.jsx';
import Loading from '../components/Loading.jsx';

const MODEL_ARCHITECTURE_DETAIL = {
  linear_regression: {
    name: 'Linear Regression',
    color: 'var(--electric-cyan)',
    icon: '📐',
    architecture: 'OLS / Ridge Regression',
    features: ['Hour of day (sin/cos encoding)', 'Day of week', 'Lag-1h, Lag-24h', 'Rolling mean 24h', 'Weekend indicator'],
    training: 'Ordinary Least Squares on feature matrix with 168h lag window. Regularized via Ridge (α=0.01).',
    validation: 'Walk-forward validation on last 30 days. No future leakage.',
    complexity: 'O(n·p²)',
    latency: '~1.2ms',
  },
  xgboost: {
    name: 'XGBoost Regressor',
    color: 'var(--electric-blue)',
    icon: '⚡',
    architecture: 'Gradient Boosted Decision Trees',
    features: ['Lag-1h, Lag-2h, Lag-24h, Lag-48h, Lag-168h', 'Hour, DayOfWeek, Month (cyclic)', 'Rolling mean/std 6h/24h', 'Sub-metering ratios', 'Voltage features'],
    training: '500 estimators, max_depth=6, learning_rate=0.05. Early stopping on val set. Feature importance via SHAP.',
    validation: 'Chronological 80/20 split. Hyperparameter tuning via Optuna (50 trials).',
    complexity: 'O(n·d·T) where T=trees',
    latency: '~4.5ms',
  },
  lstm: {
    name: 'LSTM Neural Network',
    color: 'var(--deep-purple)',
    icon: '🧠',
    architecture: 'Stacked LSTM + Dense Head',
    features: ['48-step sequence input window', 'Multivariate: power, voltage, sub-metering', 'Temporal embeddings (hour, weekday)', 'Batch normalization', 'Dropout 0.2'],
    training: '2-layer LSTM (128→64 units). Adam optimizer, lr=1e-3. 100 epochs, batch=64. MSE loss.',
    validation: 'TimeSeriesSplit (5 folds). Evaluated on expanding window.',
    complexity: 'O(n·L·H²) — L=sequence, H=hidden',
    latency: '~18ms',
  },
};

export default function ModelsPage({ activeModel, onSelectModel, userRole }) {
  const [models, setModels] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [trainingDatasetId, setTrainingDatasetId] = useState('');
  const [training, setTraining] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchData = async () => {
    try {
      const [mods, comp] = await Promise.all([
        api.getModels(),
        api.compareModels(),
      ]);
      setModels(Array.isArray(mods) ? mods : []);
      setComparison(comp);
      if (userRole === 'admin') {
        const availableDatasets = await api.getDatasets();
        setDatasets(Array.isArray(availableDatasets) ? availableDatasets : []);
        setTrainingDatasetId((current) => current || String(availableDatasets[0]?.id || ''));
      }
    } catch (err) {
      console.error('Models fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userRole]);

  const trainAllModels = async () => {
    if (!trainingDatasetId) return;
    setTraining(true);
    setActionError('');
    setActionMessage('Training Linear Regression, XGBoost, and LSTM...');
    try {
      await api.trainModels(Number(trainingDatasetId));
      setActionMessage('All three models were trained and their metrics were updated.');
      await fetchData();
    } catch (err) {
      setActionError(err.message || 'Model training failed.');
      setActionMessage('');
    } finally {
      setTraining(false);
    }
  };

  const togglePublication = async (model) => {
    setActionError('');
    setActionMessage('');
    try {
      await api.setModelPublication(model.id, !model.is_published);
      setActionMessage(`${model.name} ${model.is_published ? 'is now hidden from users.' : 'is now published to users.'}`);
      await fetchData();
    } catch (err) {
      setActionError(err.message || 'Could not update model publication.');
    }
  };

  if (loading) return <Loading message="Loading model benchmarks..." />;

  const detailModel = selectedDetail ? MODEL_ARCHITECTURE_DETAIL[selectedDetail] : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
            Model Benchmarks
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Comparative performance metrics across all trained time-series ML models
          </p>
        </div>
        {comparison?.recommended_model && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--energy-amber)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Recommended: <strong style={{ color: 'var(--energy-amber)' }}>XGBoost</strong>
            </span>
          </div>
        )}
      </div>

      {userRole === 'admin' && <section style={{ display: 'flex', alignItems: 'end', gap: '0.75rem', padding: '1rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'grid', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 700 }}>
          TRAINING DATASET
          <select value={trainingDatasetId} onChange={(event) => setTrainingDatasetId(event.target.value)} disabled={!datasets.length || training} style={{ minWidth: '260px', padding: '0.65rem 0.75rem', color: 'var(--text-primary)', background: 'var(--surface-control)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
            {datasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name} · {dataset.row_count.toLocaleString()} rows</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-primary" onClick={trainAllModels} disabled={!trainingDatasetId || training}>
          <Play size={15} /> {training ? 'Training all models…' : 'Train all three'}
        </button>
        {actionMessage && <span role="status" style={{ color: 'var(--eco-emerald)', fontSize: '0.82rem' }}>{actionMessage}</span>}
        {actionError && <span role="alert" style={{ color: 'var(--alert-rose)', fontSize: '0.82rem' }}>{actionError}</span>}
        {!datasets.length && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Upload a dataset before training.</span>}
      </section>}

      {/* Benchmark Info Banner */}
      {comparison && (
        <div style={{
          padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
          background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)',
          fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.75rem',
          display: 'flex', gap: '1rem', alignItems: 'center'
        }}>
          <BarChart2 size={16} color="var(--electric-blue)" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: 'var(--electric-blue)' }}>Benchmark Dataset:</strong>{' '}
            {comparison.benchmark_dataset} · Strict chronological validation (no future leakage) ·
            Metrics computed on held-out last 30 days of data.
          </span>
        </div>
      )}

      {/* Performance Matrix Table */}
      <ModelMetrics
        models={models}
        activeModel={activeModel}
        onSelectModel={onSelectModel}
        isAdmin={userRole === 'admin'}
        onTogglePublication={togglePublication}
      />

      {/* Architecture Cards */}
      <div style={{ marginTop: '1.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
          Architecture Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {Object.entries(MODEL_ARCHITECTURE_DETAIL).filter(([key]) => userRole === 'admin' || models.some((model) => model.model_type === key)).map(([key, info]) => {
            const modelData = models.find(m => m.model_type === key);
            const isActive = activeModel === key;
            const isExpanded = selectedDetail === key;

            return (
              <div
                key={key}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  borderColor: isActive ? `${info.color}40` : undefined,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setSelectedDetail(isExpanded ? null : key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: info.color }}>
                      {info.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{info.architecture}</div>
                  </div>
                  {isActive && (
                    <span className="badge badge-info" style={{ fontSize: '0.62rem', marginLeft: 'auto' }}>
                      Active
                    </span>
                  )}
                </div>

                {/* Quick metrics */}
                {modelData && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'MAE', val: modelData.mae ? `${Number(modelData.mae).toFixed(3)} kW` : '-', color: info.color },
                      { label: 'R²', val: modelData.r2_score ? Number(modelData.r2_score).toFixed(3) : '-', color: 'var(--eco-emerald)' },
                      { label: 'MAPE', val: modelData.mape ? `${Number(modelData.mape).toFixed(1)}%` : '-', color: 'var(--energy-amber)' },
                      { label: 'Latency', val: info.latency, color: 'var(--text-secondary)' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{
                        padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.03)'
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.85rem', color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Features</div>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {info.features.map(f => (
                          <li key={f} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.4rem' }}>
                            <span style={{ color: info.color }}>›</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Training</div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{info.training}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Validation</div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{info.validation}</p>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    id={`select-model-${key}`}
                    onClick={(e) => { e.stopPropagation(); onSelectModel(key); }}
                    className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', flex: 1 }}
                  >
                    {isActive ? '✓ Selected' : 'Use Model'}
                  </button>
                  <button
                    style={{
                      padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)', background: 'transparent',
                      color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer'
                    }}
                  >
                    {isExpanded ? 'Collapse ▲' : 'Details ▼'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
