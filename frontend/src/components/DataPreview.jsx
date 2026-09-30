import React from 'react';
import { Table, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPower, formatEnergy, formatDateTime } from '../utils/formatters';

export default function DataPreview({ readings = [], totalCount = 0, page = 1, pageSize = 50, onPageChange }) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Table size={18} color="var(--electric-blue)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Time-Series Telemetry Explorer</h3>
          <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
            {totalCount.toLocaleString()} Total Records
          </span>
        </div>

        {/* Pagination Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
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
              <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
              <th style={{ padding: '0.75rem 1rem' }}>Active Power</th>
              <th style={{ padding: '0.75rem 1rem' }}>Interval Energy</th>
              <th style={{ padding: '0.75rem 1rem' }}>Grid Voltage</th>
              <th style={{ padding: '0.75rem 1rem' }}>Current</th>
              <th style={{ padding: '0.75rem 1rem' }}>Sub 1 (Kitchen)</th>
              <th style={{ padding: '0.75rem 1rem' }}>Sub 2 (Laundry)</th>
              <th style={{ padding: '0.75rem 1rem' }}>Sub 3 (Climate)</th>
            </tr>
          </thead>
          <tbody>
            {readings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No readings available to preview.
                </td>
              </tr>
            ) : (
              readings.map((r, i) => (
                <tr
                  key={r.id || i}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {formatDateTime(r.timestamp)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--electric-cyan)' }}>
                    {formatPower(r.global_active_power)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--energy-amber)' }}>
                    {formatEnergy(r.total_consumption_kwh || r.energy_consumption_kwh || (r.global_active_power * 1.0))}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                    {r.voltage ? `${Number(r.voltage).toFixed(1)} V` : '230.0 V'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                    {r.global_intensity ? `${Number(r.global_intensity).toFixed(1)} A` : '-'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                    {r.sub_metering_1 ? `${r.sub_metering_1} Wh` : '0 Wh'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                    {r.sub_metering_2 ? `${r.sub_metering_2} Wh` : '0 Wh'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                    {r.sub_metering_3 ? `${r.sub_metering_3} Wh` : '0 Wh'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
