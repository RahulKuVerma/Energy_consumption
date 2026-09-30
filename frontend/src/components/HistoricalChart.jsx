import React, { useState } from 'react';
import { formatPower, formatEnergy } from '../utils/formatters';

export default function HistoricalChart({ data = [], type = 'diurnal', height = 240 }) {
  const [hoverBar, setHoverBar] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No historical profile data available.
      </div>
    );
  }

  const values = data.map(d => (type === 'diurnal' ? d.avg_kw : d.kwh));
  const max = Math.max(...values, 1.0) * 1.2;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '80%',
        gap: '4px',
        paddingTop: '20px'
      }}>
        {data.map((item, idx) => {
          const val = type === 'diurnal' ? item.avg_kw : item.kwh;
          const heightPercent = Math.max(5, (val / max) * 100);
          const isHovered = hoverBar === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoverBar(idx)}
              onMouseLeave={() => setHoverBar(null)}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${heightPercent}%`,
                  borderRadius: '4px 4px 0 0',
                  background: isHovered
                    ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                    : 'linear-gradient(180deg, rgba(56, 189, 248, 0.4) 0%, rgba(2, 132, 199, 0.2) 100%)',
                  transition: 'all 0.15s ease',
                  boxShadow: isHovered ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none'
                }}
              />

              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: '105%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-focus)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.75rem',
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  zIndex: 20,
                  pointerEvents: 'none'
                }}>
                  <div>{type === 'diurnal' ? `${item.hour}:00 hrs` : item.date}</div>
                  <strong style={{ color: 'var(--electric-cyan)' }}>
                    {type === 'diurnal' ? formatPower(val) : formatEnergy(val)}
                  </strong>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X-Axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0.5rem',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }}>
        {type === 'diurnal' ? (
          <>
            <span>00:00 (Night)</span>
            <span>06:00 (Morning)</span>
            <span>12:00 (Noon)</span>
            <span>18:00 (Peak Evening)</span>
            <span>23:00</span>
          </>
        ) : (
          <>
            <span>{data[0]?.date}</span>
            <span>{data[Math.floor(data.length / 2)]?.date}</span>
            <span>{data[data.length - 1]?.date}</span>
          </>
        )}
      </div>
    </div>
  );
}
