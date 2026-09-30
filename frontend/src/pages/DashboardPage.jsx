import React, { useState, useEffect } from 'react';
import { 
  Zap, TrendingUp, DollarSign, Leaf, AlertTriangle, 
  RefreshCw, Activity, Clock
} from 'lucide-react';
import { api } from '../services/api.js';
import ForecastChart from '../components/ForecastChart.jsx';
import HistoricalChart from '../components/HistoricalChart.jsx';
import AlertCard from '../components/AlertCard.jsx';
import Loading from '../components/Loading.jsx';
import { formatEnergy, formatPower, formatCurrency, formatCarbon, formatDateTime } from '../utils/formatters.js';

function StatCard({ icon: Icon, label, value, sub, color = 'var(--electric-blue)' }) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '90px', height: '90px', borderRadius: '50%',
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}30`
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-display)', color }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{sub}</div>
      )}
    </div>
  );
}

export default function DashboardPage({ selectedDatasetId, activeDataset, selectedModel, settings, onSelectModel }) {
  const [analytics, setAnalytics] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modelSaveError, setModelSaveError] = useState('');

  const handleModelChange = async (model) => {
    setModelSaveError('');
    try {
      await onSelectModel(model);
    } catch (err) {
      setModelSaveError(err.message || 'Could not save the selected model.');
    }
  };

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const [ana, alrts] = await Promise.all([
        api.getAnalyticsSummary(selectedDatasetId),
        settings.alerts_enabled ? api.getAlerts(false) : Promise.resolve([]),
      ]);
      setAnalytics(ana);
      setAlerts(Array.isArray(alrts) ? alrts.slice(0, 4) : []);
      setForecast(null);
      setForecast(ana?.has_data
        ? await api.getQuickForecast(selectedModel, settings.default_horizon, selectedDatasetId)
        : null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDatasetId, selectedModel, settings.default_horizon, settings.alerts_enabled]);

  if (loading) return <Loading message="Loading energy dashboard..." />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
            Energy Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Data source: {activeDataset?.name || 'All datasets'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Model selector */}
          <select
            id="dashboard-model-select"
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', borderRadius: 'var(--radius-md)',
              padding: '0.55rem 1rem', fontSize: '0.85rem', cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="linear_regression">Linear Regression</option>
            <option value="xgboost">XGBoost</option>
            <option value="lstm">LSTM Neural Net</option>
          </select>
          <button
            id="dashboard-refresh-btn"
            onClick={() => fetchData(true)}
            className="btn btn-secondary"
            disabled={refreshing}
            style={{ gap: '0.4rem' }}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>
      {modelSaveError && <p role="alert" style={{ color: 'var(--alert-rose)', marginTop: '-1.5rem', marginBottom: '1.5rem' }}>{modelSaveError}</p>}

      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          icon={Zap}
          label="Total Consumption"
          value={analytics?.has_data ? formatEnergy(analytics.total_consumption_kwh) : '—'}
          sub="Dataset period aggregate"
          color="var(--electric-blue)"
        />
        <StatCard
          icon={Activity}
          label="Avg Demand"
          value={analytics?.has_data ? formatPower(analytics.avg_hourly_kw) : '—'}
          sub="Mean active power draw"
          color="var(--electric-cyan)"
        />
        <StatCard
          icon={TrendingUp}
          label="Peak Demand"
          value={analytics?.has_data ? formatPower(analytics.peak_demand_kw) : '—'}
          sub={analytics?.has_data && analytics.peak_timestamp ? `At ${formatDateTime(analytics.peak_timestamp)}` : 'Highest recorded'}
          color="var(--energy-amber)"
        />
        <StatCard
          icon={DollarSign}
          label="Estimated Cost"
          value={analytics?.has_data ? formatCurrency(analytics.estimated_cost, settings.currency) : '—'}
          sub={analytics?.has_data ? `${formatCarbon(analytics.estimated_co2_kg)} CO₂ emitted` : 'No recorded readings'}
          color="var(--eco-emerald)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* 24h Forecast */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <TrendingUp size={20} color="var(--electric-blue)" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{settings.default_horizon}-Hour Forecast</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {selectedModel.replace('_', ' ')} · 95% CI band
                </p>
              </div>
            </div>
            {forecast && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Predicted Peak</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--energy-amber)' }}>
                  {formatPower(forecast.peak_forecast)}
                </div>
              </div>
            )}
          </div>
          {forecast ? (
            <ForecastChart forecastItems={forecast.forecast_items} height={240} />
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              {analytics?.has_data ? 'Forecast is unavailable.' : 'Upload a dataset to view a forecast.'}
            </div>
          )}
        </div>

        {/* Daily Trend */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <Clock size={20} color="var(--electric-cyan)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Daily Energy Trend</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 7 days · kWh/day</p>
            </div>
          </div>
          <HistoricalChart data={analytics?.daily_trend || []} type="daily" height={240} />
        </div>
      </div>

      {/* Bottom Row: Sub-metering + Alerts */}
      <div className="grid-cols-2">
        {/* Sub-metering Breakdown */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            ⚡ Sub-metering Breakdown
          </h3>
          {analytics?.has_data && analytics.submetering ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Kitchen & Dishwasher', key: 'kitchen_kwh', color: 'var(--electric-blue)' },
                { label: 'Laundry Room', key: 'laundry_kwh', color: 'var(--electric-cyan)' },
                { label: 'HVAC & Water Heater', key: 'climate_kwh', color: 'var(--energy-amber)' },
                { label: 'Other Circuits', key: 'other_kwh', color: 'var(--deep-purple)' },
              ].map(({ label, key, color }) => {
                const val = analytics.submetering[key] || 0;
                const total = Object.values(analytics.submetering).reduce((a, b) => a + b, 0) || 1;
                const pct = (val / total) * 100;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '600', color }}>
                        {formatEnergy(val)} · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        width: `${pct}%`, background: color,
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: `0 0 8px ${color}60`
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Upload a dataset to view sub-metering data.
            </div>
          )}
        </div>

        {/* Active Alerts */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={20} color="var(--alert-rose)" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Active Alerts</h3>
            </div>
            {alerts.length > 0 && (
              <span className="badge badge-danger">{alerts.length} Active</span>
            )}
          </div>
          {!settings.alerts_enabled ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Alerts are disabled in Settings.
            </div>
          ) : alerts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '2rem 1rem',
              color: 'var(--text-muted)', fontSize: '0.88rem'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              No active anomaly alerts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alerts.map((a) => (
                <AlertCard key={a.id} alert={a} onResolve={() => fetchData()} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
