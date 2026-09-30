import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export default function AlertCard({ alert, onResolve }) {
  const getSeverityStyle = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return {
          icon: AlertCircle,
          badgeClass: 'badge-danger',
          borderColor: 'rgba(244, 63, 94, 0.3)',
          iconColor: 'var(--alert-rose)'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          badgeClass: 'badge-warning',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          iconColor: 'var(--energy-amber)'
        };
      default:
        return {
          icon: Info,
          badgeClass: 'badge-info',
          borderColor: 'rgba(56, 189, 248, 0.3)',
          iconColor: 'var(--electric-blue)'
        };
    }
  };

  const style = getSeverityStyle(alert.severity);
  const Icon = style.icon;

  return (
    <div className="glass-card" style={{
      padding: '1.25rem',
      borderColor: style.borderColor,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', gap: '0.85rem' }}>
        <div style={{
          padding: '0.5rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} color={style.iconColor} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{alert.title}</h4>
            <span className={`badge ${style.badgeClass}`}>{alert.severity}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {alert.message}
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Time: {formatDateTime(alert.timestamp)}</span>
            {alert.actual_value && (
              <span>Reading: <strong style={{ color: 'var(--text-primary)' }}>{alert.actual_value}</strong></span>
            )}
            {alert.threshold_value && (
              <span>Threshold: <strong style={{ color: 'var(--text-primary)' }}>{alert.threshold_value}</strong></span>
            )}
          </div>
        </div>
      </div>

      {!alert.is_resolved && (
        <button
          onClick={() => onResolve(alert.id)}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          <CheckCircle2 size={14} color="var(--eco-emerald)" />
          <span>Acknowledge</span>
        </button>
      )}
    </div>
  );
}
