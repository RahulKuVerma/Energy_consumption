import React, { useState } from 'react';
import { Activity, ArrowRight, LockKeyhole, UserRound } from 'lucide-react';
import { api } from '../services/api.js';

export default function LoginPage({ onAuthenticated }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = isRegistering
        ? await api.register(username, password)
        : await api.login(username, password);
      localStorage.setItem('accessToken', result.access_token);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err.message || 'Could not authenticate. Check the server and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-layout" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(340px, 0.85fr)', background: 'var(--bg-primary)' }}>
      <section className="login-brand-panel" style={{ padding: 'clamp(2rem, 7vw, 6rem)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(145deg, #102d37 0%, #101c2a 54%, #18261f 100%)', borderRight: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={25} color="#64d7bd" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>VoltCast</span>
        </div>
        <div style={{ maxWidth: '580px', padding: '5rem 0' }}>
          <p style={{ color: '#76d8c1', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.25rem' }}>Energy intelligence workspace</p>
          <h1 className="login-headline" style={{ fontSize: '3.5rem', lineHeight: 1.04, marginBottom: '1.25rem', color: '#f4f7f4' }}>Forecast with the data you trust.</h1>
          <p style={{ maxWidth: '440px', color: '#b7c9c4', fontSize: '1rem', lineHeight: 1.75 }}>Sign in to manage energy datasets, train forecasting models, or run predictions published by your administrator.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a0b7b0', fontSize: '0.8rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#64d7bd' }} />
          Secure workspace access
        </div>
      </section>

      <section className="login-form-panel" style={{ display: 'grid', placeItems: 'center', padding: '2rem' }}>
        <form onSubmit={submit} style={{ width: 'min(100%, 390px)' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.45rem' }}>{isRegistering ? 'Create user account' : 'Welcome back'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{isRegistering ? 'Register for a user workspace.' : 'Enter your account details to continue.'}</p>
          </div>

          {error && <div role="alert" style={{ marginBottom: '1rem', padding: '0.75rem 0.9rem', border: '1px solid var(--alert-rose)', color: 'var(--alert-rose)', borderRadius: '6px', fontSize: '0.84rem' }}>{error}</div>}

          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }} htmlFor="login-username">Username</label>
          <div style={{ position: 'relative', marginBottom: '1.1rem' }}>
            <UserRound size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input id="login-username" autoComplete="username" required minLength={3} value={username} onChange={(event) => setUsername(event.target.value)} style={fieldStyle} />
          </div>

          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }} htmlFor="login-password">Password</label>
          <div style={{ position: 'relative', marginBottom: '1.35rem' }}>
            <LockKeyhole size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input id="login-password" type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} style={fieldStyle} />
          </div>

          <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', minHeight: '46px', justifyContent: 'center' }}>
            {busy ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
            {!busy && <ArrowRight size={16} />}
          </button>

          <div style={{ marginTop: '1.3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            {isRegistering ? 'Already registered?' : 'Need a user account?'}{' '}
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }} style={{ border: 0, background: 'none', color: 'var(--electric-cyan)', font: 'inherit', cursor: 'pointer', fontWeight: 700 }}>
              {isRegistering ? 'Sign in' : 'Register'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

const fieldStyle = {
  width: '100%',
  height: '46px',
  borderRadius: '6px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-control)',
  color: 'var(--text-primary)',
  padding: '0 0.85rem 0 2.5rem',
  outlineColor: 'var(--border-focus)',
};