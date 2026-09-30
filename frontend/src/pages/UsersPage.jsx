import React, { useEffect, useState } from 'react';
import { KeyRound, Users } from 'lucide-react';
import { api } from '../services/api.js';
import Loading from '../components/Loading.jsx';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getUsers()
      .then((result) => setUsers(Array.isArray(result) ? result : []))
      .catch((err) => setError(err.message || 'Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  const resetPassword = async (event, user) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.resetUserPassword(user.id, newPassword);
      setMessage(`Password reset for ${user.username}.`);
      setResetUserId(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Could not reset the password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading message="Loading users..." />;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>User Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Accounts and access roles</p>
      </div>

      {error && <p role="alert" style={{ color: 'var(--alert-rose)', marginBottom: '1rem' }}>{error}</p>}
      {message && <p role="status" style={{ color: 'var(--eco-emerald)', marginBottom: '1rem' }}>{message}</p>}

      <section className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <Users size={19} color="var(--electric-blue)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Accounts ({users.length})</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.8rem' }}>Username</th>
                <th style={{ padding: '0.8rem' }}>Role</th>
                <th style={{ padding: '0.8rem' }}>Created</th>
                <th style={{ padding: '0.8rem' }}>Password</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <React.Fragment key={user.id}>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.9rem 0.8rem', fontWeight: 600 }}>{user.username}</td>
                    <td style={{ padding: '0.9rem 0.8rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{user.role}</td>
                    <td style={{ padding: '0.9rem 0.8rem', color: 'var(--text-muted)' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.9rem 0.8rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setResetUserId(resetUserId === user.id ? null : user.id);
                          setNewPassword('');
                          setError('');
                        }}
                        style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        <KeyRound size={14} /> Reset password
                      </button>
                    </td>
                  </tr>
                  {resetUserId === user.id && (
                    <tr>
                      <td colSpan={4} style={{ padding: '0.75rem 0.8rem', background: 'rgba(255,255,255,0.025)' }}>
                        <form onSubmit={(event) => resetPassword(event, user)} style={{ display: 'flex', alignItems: 'end', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <label style={{ display: 'grid', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            New password
                            <input
                              type="password"
                              autoComplete="new-password"
                              minLength={8}
                              maxLength={128}
                              required
                              value={newPassword}
                              onChange={(event) => setNewPassword(event.target.value)}
                              style={{ minWidth: '240px', padding: '0.6rem 0.7rem', color: 'var(--text-primary)', background: 'var(--surface-control)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
                            />
                          </label>
                          <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.55rem 0.8rem' }}>
                            {saving ? 'Saving...' : 'Set password'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {!users.length && (
                <tr><td colSpan={4} style={{ padding: '1.25rem 0.8rem', color: 'var(--text-muted)' }}>No user accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}