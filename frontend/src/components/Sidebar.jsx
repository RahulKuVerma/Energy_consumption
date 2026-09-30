import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  TrendingUp, 
  BarChart3, 
  Cpu, 
  Database,
  Settings as SettingsIcon,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, role = 'admin', username = '', onLogout }) {
  const adminItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'forecast', label: 'Forecast Studio', icon: TrendingUp },
    { id: 'upload', label: 'Upload Data', icon: UploadCloud },
    { id: 'datasets', label: 'Dataset Library', icon: Database },
    { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'models', label: 'Model Benchmarks', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];
  const userItems = [
    { id: 'forecast', label: 'Forecast Studio', icon: TrendingUp },
    { id: 'upload', label: 'Upload Data', icon: UploadCloud },
    { id: 'datasets', label: 'My Datasets', icon: Database },
    { id: 'models', label: 'Published Models', icon: Cpu },
  ];
  const navItems = role === 'admin' ? adminItems : userItems;

  return (
    <aside style={{
      width: '260px',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      background: 'var(--surface-sidebar)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 60,
      padding: '1.5rem 1rem',
      overflowY: 'auto'
    }}>
      {/* Brand Header */}
      <div style={{ padding: '0.5rem 0.75rem 2rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={18} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
            Volt<span style={{ color: 'var(--electric-blue)' }}>Cast</span>
          </span>
          <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)' }}>
            v1.0.0 Enterprise Core
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.8rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive 
                  ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.05) 100%)' 
                  : 'transparent',
                color: isActive ? 'var(--electric-blue)' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                position: 'relative',
                outline: 'none'
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '15%',
                  bottom: '15%',
                  width: '3px',
                  borderRadius: '0 4px 4px 0',
                  background: 'var(--electric-blue)',
                  boxShadow: '0 0 10px var(--electric-blue)'
                }} />
              )}
              <Icon size={19} color={isActive ? 'var(--electric-blue)' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '0.85rem 0.75rem', borderTop: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
        <div style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>{username}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'capitalize', marginTop: '0.1rem' }}>{role}</div>
        <button type="button" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', border: 0, background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.65rem 0 0', fontSize: '0.8rem' }}>
          <LogOut size={15} /> Sign out
        </button>
      </div>

      {/* Architecture Footer Stamp */}
      {role === 'admin' && <div style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Sampling Interval</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>15 Min</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Primary Target</span>
          <span style={{ color: 'var(--electric-cyan)', fontWeight: '600' }}>kWh</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Core Engine</span>
          <span style={{ color: 'var(--eco-emerald)', fontWeight: '600' }}>XGBoost / LSTM</span>
        </div>
      </div>}
    </aside>
  );
}
