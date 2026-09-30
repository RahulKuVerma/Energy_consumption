import React from 'react';
import { Cpu, CheckCircle2, Award, Eye, EyeOff } from 'lucide-react';
import { formatPercent } from '../utils/formatters';

export default function ModelMetrics({ models = [], onSelectModel, activeModel = 'xgboost', isAdmin = false, onTogglePublication }) {
  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Cpu size={20} color="var(--electric-blue)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Time-Series Model Performance Matrix</h3>
        </div>
        <span className="badge badge-success">
          <Award size={13} /> Strict Chronological Validation
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.85rem',
          textAlign: 'left'
        }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '0.85rem 1rem' }}>Model Architecture</th>
              <th style={{ padding: '0.85rem 1rem' }}>Type</th>
              <th style={{ padding: '0.85rem 1rem' }}>MAE (kW)</th>
              <th style={{ padding: '0.85rem 1rem' }}>RMSE (kW)</th>
              <th style={{ padding: '0.85rem 1rem' }}>MAPE (%)</th>
              <th style={{ padding: '0.85rem 1rem' }}>R² Score</th>
              <th style={{ padding: '0.85rem 1rem' }}>Action</th>
              {isAdmin && <th style={{ padding: '0.85rem 1rem' }}>User Access</th>}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => {
              const isSelected = activeModel === m.model_type;
              const isBest = m.model_type === 'xgboost';

              return (
                <tr
                  key={m.id || m.model_type}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.06)' : 'transparent',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <td style={{ padding: '1rem', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{m.name}</span>
                      {isBest && (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                          Top Accuracy
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {m.model_type.replace('_', ' ')}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '600' }}>
                    {m.mae !== null ? `${Number(m.mae).toFixed(3)} kW` : '-'}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {m.rmse !== null ? `${Number(m.rmse).toFixed(3)} kW` : '-'}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--electric-cyan)', fontWeight: '600' }}>
                    {m.mape !== null ? formatPercent(m.mape) : '-'}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--eco-emerald)', fontWeight: '600' }}>
                    {m.r2_score !== null ? Number(m.r2_score).toFixed(3) : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => onSelectModel(m.model_type)}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Active Model</span>
                        </>
                      ) : (
                        <span>Select</span>
                      )}
                    </button>
                  </td>
                  {isAdmin && <td style={{ padding: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => onTogglePublication(m)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.7rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      {m.is_published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
                    </button>
                  </td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
