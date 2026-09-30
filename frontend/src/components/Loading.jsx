import React from 'react';

export default function Loading({ message = 'Computing Forecast...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      gap: '1rem',
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        position: 'relative',
        width: '48px',
        height: '48px'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid rgba(56, 189, 248, 0.15)',
          borderTopColor: 'var(--electric-blue)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--electric-cyan)',
          boxShadow: '0 0 10px var(--electric-cyan)'
        }} />
      </div>
      <p style={{
        fontSize: '0.9rem',
        fontWeight: '500',
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-mono)'
      }}>
        {message}
      </p>
    </div>
  );
}
