import React, { useState, useMemo } from 'react';
import { formatPower, formatTimeOnly, formatDateTime } from '../utils/formatters';

export default function ForecastChart({ forecastItems = [], height = 320 }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const { points, upperPoints, lowerPoints, maxVal, minVal, peakPoint } = useMemo(() => {
    if (!forecastItems || forecastItems.length === 0) {
      return { points: [], upperPoints: [], lowerPoints: [], maxVal: 5, minVal: 0, peakPoint: null };
    }

    const allValues = forecastItems.flatMap(it => [
      it.predicted_value,
      it.upper_bound || it.predicted_value,
      it.lower_bound || it.predicted_value
    ]);

    const max = Math.max(...allValues, 1.0) * 1.15;
    const min = Math.max(0, Math.min(...allValues) * 0.85);

    let peak = null;
    let peakVal = -1;

    const pts = forecastItems.map((item, idx) => {
      const xPercent = (idx / (forecastItems.length - 1 || 1)) * 100;
      const yVal = item.predicted_value;
      const yPercent = 100 - ((yVal - min) / (max - min || 1)) * 100;
      
      const upVal = item.upper_bound || yVal;
      const upPercent = 100 - ((upVal - min) / (max - min || 1)) * 100;

      const lowVal = item.lower_bound || yVal;
      const lowPercent = 100 - ((lowVal - min) / (max - min || 1)) * 100;

      if (yVal > peakVal) {
        peakVal = yVal;
        peak = { xPercent, yPercent, item, index: idx };
      }

      return { xPercent, yPercent, upPercent, lowPercent, item };
    });

    return {
      points: pts,
      upperPoints: pts.map(p => `${p.xPercent},${p.upPercent}`).join(' '),
      lowerPoints: pts.slice().reverse().map(p => `${p.xPercent},${p.lowPercent}`).join(' '),
      maxVal: max,
      minVal: min,
      peakPoint: peak
    };
  }, [forecastItems]);

  if (!forecastItems || forecastItems.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No forecast points available to render.
      </div>
    );
  }

  // Build SVG Path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.xPercent} ${p.yPercent}`).join(' ');
  const areaPath = `M ${points[0].xPercent} 100 ` + points.map(p => `L ${p.xPercent} ${p.yPercent}`).join(' ') + ` L ${points[points.length-1].xPercent} 100 Z`;
  
  // Confidence band polygon string
  const bandPointsString = points.map(p => `${p.xPercent},${p.upPercent}`).join(' ') + ' ' + points.slice().reverse().map(p => `${p.xPercent},${p.lowPercent}`).join(' ');

  const activeItem = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      {/* Chart SVG */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* 95% Confidence Band Polygon */}
        <polygon
          points={bandPointsString}
          fill="rgba(56, 189, 248, 0.12)"
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Area fill under curve */}
        <path d={areaPath} fill="url(#forecastAreaGrad)" />

        {/* Primary Predicted Curve */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Peak Demand Beacon */}
        {peakPoint && (
          <g>
            <circle
              cx={peakPoint.xPercent}
              cy={peakPoint.yPercent}
              r="4"
              fill="var(--energy-amber)"
              stroke="#ffffff"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}

        {/* Hover Highlight */}
        {activeItem && (
          <g>
            <line
              x1={activeItem.xPercent}
              y1="0"
              x2={activeItem.xPercent}
              y2="100"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={activeItem.xPercent}
              cy={activeItem.yPercent}
              r="5"
              fill="var(--electric-cyan)"
              stroke="#ffffff"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}

        {/* Mouse Capture Rects for easy hovering */}
        {points.map((p, idx) => (
          <rect
            key={idx}
            x={p.xPercent - (100 / points.length) / 2}
            y="0"
            width={100 / points.length}
            height="100"
            fill="transparent"
            onMouseEnter={() => setHoverIndex(idx)}
            style={{ cursor: 'crosshair' }}
          />
        ))}
      </svg>

      {/* Floating Tooltip */}
      {activeItem && (
        <div style={{
          position: 'absolute',
          left: `${Math.min(85, Math.max(15, activeItem.xPercent))}%`,
          top: '15px',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.5rem 0.85rem',
          boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
          zIndex: 10,
          whiteSpace: 'nowrap'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            {formatDateTime(activeItem.item.timestamp)}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--electric-cyan)' }}>
            Predicted: {formatPower(activeItem.item.predicted_value)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            95% Range: {formatPower(activeItem.item.lower_bound)} - {formatPower(activeItem.item.upper_bound)}
          </div>
        </div>
      )}

      {/* Peak Badge Overlay */}
      {peakPoint && hoverIndex === null && (
        <div style={{
          position: 'absolute',
          left: `${peakPoint.xPercent}%`,
          top: `${Math.max(5, peakPoint.yPercent - 12)}%`,
          transform: 'translate(-50%, -100%)',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid var(--energy-amber)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.2rem 0.5rem',
          fontSize: '0.7rem',
          fontWeight: '700',
          color: 'var(--energy-amber)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          Peak: {formatPower(peakPoint.item.predicted_value)}
        </div>
      )}

      {/* Axis Scale Markers */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: '5px',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }}>
        {formatPower(maxVal)}
      </div>
      <div style={{
        position: 'absolute',
        bottom: '5px',
        right: '5px',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }}>
        {formatPower(minVal)}
      </div>
    </div>
  );
}
