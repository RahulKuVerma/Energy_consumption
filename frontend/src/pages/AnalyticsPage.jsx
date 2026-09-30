import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, RefreshCw, Flame, Clock, TrendingDown } from 'lucide-react';
import { api } from '../services/api.js';
import HistoricalChart from '../components/HistoricalChart.jsx';
import Loading from '../components/Loading.jsx';
import { formatPower, formatEnergy, formatCurrency, formatCarbon, formatDateTime } from '../utils/formatters.js';

function HourlyHeatmap({ hourlyProfile }) {
  if (!hourlyProfile || hourlyProfile.length === 0) return null;
  const maxKw = Math.max(...hourlyProfile.map(h => h.avg_kw), 1);
  
  return (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(24, 1fr)', 
        gap: '3px',
        marginBottom: '0.5rem'
      }}>
        {Array.from({ length: 24 }, (_, hour) => {
          const entry = hourlyProfile.find(h => h.hour === hour);
          const val = entry ? entry.avg_kw : 0;
          const intensity = val / maxKw;
          const r = Math.round(56 + (245 - 56) * intensity);
          const g = Math.round(189 - (189 - 158) * intensity);
          const b = Math.round(248 - (248 - 11) * intensity);
          return (
            <div
              key={hour}
              title={`${hour}:00 — ${val.toFixed(2)} kW`}
              style={{
                height: '40px',
                borderRadius: '4px',
                background: `rgba(${r},${g},${b},${0.3 + 0.7 * intensity})`,
                border: `1px solid rgba(${r},${g},${b},0.2)`,
                cursor: 'default',
                transition: 'transform 0.1s ease',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '3px' }}>
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{ 
            fontSize: '0.62rem', color: 'var(--text-muted)', 
            textAlign: 'center', fontFamily: 'var(--font-mono)'
          }}>
            {h}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage({ selectedDatasetId, activeDataset, settings }) {
  const [analytics, setAnalytics] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zThreshold, setZThreshold] = useState(settings.anomaly_zscore_threshold);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => setZThreshold(settings.anomaly_zscore_threshold), [settings.anomaly_zscore_threshold]);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [ana, anoms] = await Promise.all([
        api.getAnalyticsSummary(selectedDatasetId),
        api.getAnomalies(zThreshold, selectedDatasetId),
      ]);
      setAnalytics(ana);
      setAnomalies(Array.isArray(anoms) ? anoms : []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDatasetId, zThreshold]);

  if (loading) return <Loading message="Computing analytics..." />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
            Analytics & Insights
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Data source: {activeDataset?.name || 'All datasets'}
          </p>
        </div>
        <button
          id="analytics-refresh-btn"
          onClick={() => fetchData(true)}
          className="btn btn-secondary"
          disabled={refreshing}
        >
          <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        {[
          { icon: BarChart3, label: 'Total Consumption', value: formatEnergy(analytics?.total_consumption_kwh), color: 'var(--electric-blue)' },
          { icon: Flame, label: 'Peak Demand', value: formatPower(analytics?.peak_demand_kw), color: 'var(--energy-amber)' },
          { icon: TrendingDown, label: 'Estimated Cost', value: formatCurrency(analytics?.estimated_cost, settings.currency), color: 'var(--eco-emerald)' },
          { icon: Clock, label: 'CO₂ Footprint', value: formatCarbon(analytics?.estimated_co2_kg), color: 'var(--deep-purple)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Icon size={16} color={color} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color, fontFamily: 'var(--font-display)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Trend Chart */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <BarChart3 size={20} color="var(--electric-blue)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Daily Energy Consumption Trend (Last 30 Days)</h3>
        </div>
        <HistoricalChart data={analytics?.daily_trend || []} type="daily" height={220} />
      </div>

      {/* Hourly Profile Heatmap */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <Clock size={20} color="var(--electric-cyan)" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Diurnal Load Profile</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average consumption by hour of day (0–23)</p>
          </div>
        </div>
        <HourlyHeatmap hourlyProfile={analytics?.hourly_profile || []} />
        {analytics?.hourly_profile && analytics.hourly_profile.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {(() => {
              const profile = analytics.hourly_profile;
              const max = profile.reduce((a, b) => a.avg_kw > b.avg_kw ? a : b, profile[0]);
              const min = profile.reduce((a, b) => a.avg_kw < b.avg_kw ? a : b, profile[0]);
              const morning = profile.filter(h => h.hour >= 6 && h.hour <= 9);
              const morningPeak = morning.length ? morning.reduce((a, b) => a.avg_kw > b.avg_kw ? a : b, morning[0]) : null;
              return [
                { label: 'Peak Hour', value: `${max?.hour}:00 (${formatPower(max?.avg_kw)})`, color: 'var(--energy-amber)' },
                { label: 'Off-Peak Hour', value: `${min?.hour}:00 (${formatPower(min?.avg_kw)})`, color: 'var(--eco-emerald)' },
                { label: 'Morning Peak', value: morningPeak ? `${morningPeak.hour}:00 (${formatPower(morningPeak.avg_kw)})` : '-', color: 'var(--electric-blue)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
                  <div style={{ fontWeight: '700', color, fontFamily: 'var(--font-mono)' }}>{value}</div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Anomaly Detection */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertTriangle size={20} color="var(--alert-rose)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Anomaly Detection</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Z-score statistical outlier detection</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Z-Score Threshold:</label>
            <select
              id="zscore-threshold-select"
              value={zThreshold}
              onChange={(e) => setZThreshold(Number(e.target.value))}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.65rem', fontSize: '0.82rem', cursor: 'pointer', outline: 'none'
              }}
            >
              {[1.5, 2.0, 2.5, 3.0, 3.5].map(v => (
                <option key={v} value={v}>{v}σ</option>
              ))}
            </select>
            {anomalies.length > 0 && (
              <span className="badge badge-danger">{anomalies.length} detected</span>
            )}
          </div>
        </div>

        {anomalies.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            No anomalies detected at {zThreshold}σ threshold. System consumption looks normal.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>Timestamp</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'right' }}>Active Power</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'right' }}>Voltage</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'right' }}>Z-Score</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.slice(0, 50).map((a, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {formatDateTime(a.timestamp)}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: '700', color: a.type === 'Spike' ? 'var(--alert-rose)' : 'var(--electric-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {formatPower(a.global_active_power)}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {a.voltage ? `${a.voltage.toFixed(1)} V` : '-'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '600', color: Math.abs(a.z_score) > 3 ? 'var(--alert-rose)' : 'var(--energy-amber)' }}>
                      {a.z_score > 0 ? '+' : ''}{a.z_score.toFixed(2)}σ
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <span className={`badge ${a.type === 'Spike' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.68rem' }}>
                        {a.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {anomalies.length > 50 && (
              <p style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Showing 50 of {anomalies.length} anomalies. Adjust threshold to refine.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
