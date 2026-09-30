import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, UploadCloud, ArrowRight, Check, Filter } from 'lucide-react';
import { api } from '../services/api.js';
import Loading from '../components/Loading.jsx';

function formatDate(value) {
  if (!value) return '—';
  const date = value.slice(0, 10);
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function formatUploadedAt(value) {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

export default function DatasetLibraryPage({ selectedDatasetId, onSelectDataset, onOpenDashboard, onOpenUpload, userRole }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [uploaderFilter, setUploaderFilter] = useState('all');

  const loadDatasets = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    setError('');
    try {
      const result = await api.getDatasets();
      setDatasets(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || 'Could not load stored datasets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadDatasets(); }, []);

  const uploaders = [...new Set(datasets.map((dataset) => dataset.uploaded_by || 'System'))].sort((left, right) => left.localeCompare(right));
  const visibleDatasets = userRole === 'admin' && uploaderFilter !== 'all'
    ? datasets.filter((dataset) => (dataset.uploaded_by || 'System') === uploaderFilter)
    : datasets;
  const totalRows = visibleDatasets.reduce((sum, dataset) => sum + (dataset.row_count || 0), 0);

  if (loading) return <Loading message="Loading stored datasets..." />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
            Dataset Library
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Stored datasets available for analysis and forecasting
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => loadDatasets(true)}
            disabled={refreshing}
            className="btn btn-secondary"
            aria-label="Refresh datasets"
            title="Refresh datasets"
          >
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button type="button" onClick={onOpenUpload} className="btn btn-primary">
            <UploadCloud size={16} /> Upload Data
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid var(--alert-rose)', color: 'var(--alert-rose)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <span><strong style={{ color: 'var(--text-primary)' }}>{visibleDatasets.length}</strong> {visibleDatasets.length === datasets.length ? 'datasets' : `of ${datasets.length} datasets`}</span>
        <span><strong style={{ color: 'var(--text-primary)' }}>{totalRows.toLocaleString()}</strong> readings</span>
        </div>
        {userRole === 'admin' && datasets.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <span>Uploaded by</span>
            <select
              value={uploaderFilter}
              onChange={(event) => setUploaderFilter(event.target.value)}
              aria-label="Filter datasets by uploader"
              style={{ minWidth: '170px', padding: '0.55rem 0.7rem', color: 'var(--text-primary)', background: 'var(--surface-control)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
            >
              <option value="all">All users</option>
              {uploaders.map((uploader) => <option key={uploader} value={uploader}>{uploader}</option>)}
            </select>
          </label>
        )}
      </div>

      {datasets.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <Database size={30} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>No stored datasets</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload a dataset to make it available here.</p>
          <button type="button" onClick={onOpenUpload} className="btn btn-primary">
            <UploadCloud size={16} /> Upload Data
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.9rem 1rem' }}>Dataset</th>
                  {userRole === 'admin' && <th style={{ padding: '0.9rem 1rem' }}>Uploaded by</th>}
                  <th style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>Uploaded</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Readings</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Interval</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Coverage</th>
                  <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleDatasets.map((dataset) => {
                  const isSelected = dataset.id === selectedDatasetId;
                  return (
                    <tr key={dataset.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '1rem', maxWidth: '340px' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{dataset.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: '0.2rem', overflowWrap: 'anywhere' }}>
                          {dataset.filename}
                        </div>
                      </td>
                      {userRole === 'admin' && <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{dataset.uploaded_by || 'System'}</td>}
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatUploadedAt(dataset.created_at)}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        {(dataset.row_count || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{dataset.sampling_rate || '—'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(dataset.start_timestamp)} – {formatDate(dataset.end_timestamp)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ color: dataset.status === 'processed' ? 'var(--eco-emerald)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {dataset.status || 'available'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectDataset(dataset.id);
                            onOpenDashboard();
                          }}
                          className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                        >
                          {isSelected ? <><Check size={14} /> Selected</> : <>Use in {userRole === 'admin' ? 'Dashboard' : 'forecast'} <ArrowRight size={14} /></>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!visibleDatasets.length && (
                  <tr><td colSpan={userRole === 'admin' ? 8 : 7} style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)' }}>No datasets found for this uploader.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}