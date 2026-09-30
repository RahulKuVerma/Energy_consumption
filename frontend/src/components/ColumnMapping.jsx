import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Settings2, Play } from 'lucide-react';

export default function ColumnMapping({ uploadResult, onProcess, processing, defaultResampleFreq = '1h' }) {
  const { filename, detected_delimiter, columns, suggested_mappings, file_path } = uploadResult;
  
  const [datasetName, setDatasetName] = useState(filename.replace(/\.[^/.]+$/, ""));
  const [resampleFreq, setResampleFreq] = useState(defaultResampleFreq);
  const [mapping, setMapping] = useState({ ...suggested_mappings });

  const canonicalTargets = [
    { key: 'global_active_power', label: 'Global Active Power (kW)', required: true },
    { key: 'timestamp', label: 'Timestamp (DateTime)', required: false },
    { key: 'date_col', label: 'Date Column (if separate)', required: false },
    { key: 'time_col', label: 'Time Column (if separate)', required: false },
    { key: 'voltage', label: 'Grid Voltage (V)', required: false },
    { key: 'global_reactive_power', label: 'Reactive Power (kW)', required: false },
    { key: 'global_intensity', label: 'Current Intensity (A)', required: false },
    { key: 'sub_metering_1', label: 'Sub-metering 1 (Kitchen Wh)', required: false },
    { key: 'sub_metering_2', label: 'Sub-metering 2 (Laundry Wh)', required: false },
    { key: 'sub_metering_3', label: 'Sub-metering 3 (Climate Wh)', required: false },
  ];

  const handleSelectChange = (targetKey, selectedCol) => {
    setMapping(prev => ({
      ...prev,
      [targetKey]: selectedCol === '__none__' ? null : selectedCol
    }));
  };

  const handleConfirm = () => {
    onProcess({
      file_path,
      dataset_name: datasetName,
      column_mapping: mapping,
      resample_freq: resampleFreq
    });
  };

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Confirm Schema & Column Mapping</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Detected delimiter: <code style={{ color: 'var(--electric-cyan)' }}>'{detected_delimiter}'</code> | File: <strong>{filename}</strong>
          </p>
        </div>
        <span className="badge badge-success">
          <CheckCircle2 size={13} /> {columns.length} Columns Detected
        </span>
      </div>

      {/* Dataset Settings */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.25rem',
        marginBottom: '1.75rem',
        padding: '1.25rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Dataset Name
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Resampling Target Interval
          </label>
          <select
            value={resampleFreq}
            onChange={(e) => setResampleFreq(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          >
            <option value="15min">15 Minutes (High Resolution)</option>
            <option value="30min">30 Minutes</option>
            <option value="1h">1 Hour (Standard Model Default)</option>
            <option value="1D">1 Day</option>
          </select>
        </div>
      </div>

      {/* Mapping Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {canonicalTargets.map(({ key, label, required }) => (
          <div key={key} style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${mapping[key] ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                {label} {required && <strong style={{ color: 'var(--alert-rose)' }}>*</strong>}
              </span>
              {mapping[key] && <CheckCircle2 size={14} color="var(--electric-blue)" />}
            </div>

            <select
              value={mapping[key] || '__none__'}
              onChange={(e) => handleSelectChange(key, e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--border-subtle)',
                color: mapping[key] ? 'var(--electric-cyan)' : 'var(--text-muted)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="__none__">-- Not Present in File --</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Submit Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button
          onClick={handleConfirm}
          disabled={processing || !mapping.global_active_power}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.75rem' }}
        >
          {processing ? (
            <span>Processing Time Series...</span>
          ) : (
            <>
              <span>Apply Physics-Aware Resampling & Ingest</span>
              <Play size={16} fill="currentColor" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
