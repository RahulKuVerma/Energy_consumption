import React from 'react';
import { Zap, Database } from 'lucide-react';

export default function Navbar({ backendStatus = 'checking', activeTab = 'dashboard', selectedDatasetId = null, activeDataset = null, alertCount = 0 }) {
  const datasetLabel = activeDataset?.name || (selectedDatasetId ? `Dataset #${selectedDatasetId}` : null);

  return (
    <header style={{
      height: '70px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface-nav)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2.5rem'
    }}>
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
        }}>
          <Zap size={22} color="#ffffff" fill="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Volt<span style={{ color: 'var(--electric-blue)' }}>Cast</span>
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Electrical Energy Consumption Forecasting System
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {datasetLabel && <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <Database size={14} color="var(--electric-blue)" />
          <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {datasetLabel}
          </span>
        </div>}
      </div>
    </header>
  );
}
