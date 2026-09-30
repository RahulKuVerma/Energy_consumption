import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { api } from '../services/api.js';
import FileUpload from '../components/FileUpload.jsx';
import ColumnMapping from '../components/ColumnMapping.jsx';
import DataPreview from '../components/DataPreview.jsx';

const STEPS = ['Upload File', 'Map Columns', 'Preview & Import'];

export default function UploadPage({ onDatasetLoaded, defaultResampleFreq }) {
  const [step, setStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [processedDatasetId, setProcessedDatasetId] = useState(null);
  const [previewReadings, setPreviewReadings] = useState([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewTotal, setPreviewTotal] = useState(0);

  const handleFileUploaded = (file, result) => {
    setUploadedFile(file);
    setUploadResult(result);
    setStep(1);
  };

  const handleProcess = async ({ file_path, dataset_name, column_mapping, resample_freq }) => {
    setProcessing(true);
    setError(null);
    try {
      const response = await api.processDataset(file_path, dataset_name, column_mapping, resample_freq);
      const result = response.data ?? response;
      if (!result.dataset_id) throw new Error('Dataset was processed but no dataset ID was returned.');
      setProcessedDatasetId(result.dataset_id);
      // Load preview
      try {
        const readingsData = await api.getDatasetReadings(result.dataset_id, 1, 50);
        setPreviewReadings(readingsData.readings || []);
        setPreviewTotal(readingsData.total_count ?? result.row_count ?? 0);
      } catch (_) {
        setPreviewReadings([]);
        setPreviewTotal(result.row_count || 0);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Processing failed. Check column mappings or backend connectivity.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePageChange = async (newPage) => {
    if (!processedDatasetId) return;
    try {
      const readingsData = await api.getDatasetReadings(processedDatasetId, newPage, 50);
      setPreviewReadings(readingsData.readings || []);
      setPreviewPage(newPage);
    } catch (_) {}
  };

  if (done) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', paddingTop: '3rem' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(16,185,129,0.15)', border: '2px solid var(--eco-emerald)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <CheckCircle2 size={36} color="var(--eco-emerald)" />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--eco-emerald)' }}>
          Dataset Imported Successfully!
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Your energy data has been processed and stored.<br />
          Forecasts and analytics are now available.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            id="go-dashboard-btn"
            onClick={() => onDatasetLoaded(processedDatasetId)}
            className="btn btn-primary"
            style={{ padding: '0.85rem 2rem' }}
          >
            <Database size={16} /> View Dashboard
          </button>
          <button
            id="upload-another-btn"
            onClick={() => { setStep(0); setDone(false); setUploadedFile(null); setUploadResult(null); }}
            className="btn btn-secondary"
            style={{ padding: '0.85rem 2rem' }}
          >
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
          Upload Energy Data
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Import CSV/Excel datasets · Map columns · Process into the forecasting database
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem' }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '0.85rem',
                background: i < step ? 'var(--eco-emerald)' : (i === step ? 'var(--electric-blue)' : 'rgba(255,255,255,0.07)'),
                color: i <= step ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.3s ease',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: '0.85rem', fontWeight: i === step ? '700' : '500',
                color: i === step ? 'var(--text-primary)' : (i < step ? 'var(--eco-emerald)' : 'var(--text-muted)')
              }}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: '2px', margin: '0 1rem',
                background: i < step ? 'var(--eco-emerald)' : 'rgba(255,255,255,0.07)',
                transition: 'background 0.3s ease'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ maxWidth: '900px' }}>
        {step === 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <UploadCloud size={22} color="var(--electric-blue)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Select Your Dataset File</h2>
            </div>
            <FileUpload onFileUploaded={handleFileUploaded} />
            <div style={{
              marginTop: '1.5rem', padding: '1rem 1.25rem',
              background: 'rgba(56,189,248,0.06)', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(56,189,248,0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--electric-blue)' }}>Supported formats:</strong> CSV, XLSX ·
              <strong style={{ color: 'var(--electric-blue)' }}> Recommended:</strong> UCI Household Power Consumption dataset
            </div>
          </div>
        )}

        {step === 1 && uploadResult && (
          <div>
            {error && (
              <div style={{
                padding: '1rem', borderRadius: 'var(--radius-md)',
                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                color: 'var(--alert-rose)', fontSize: '0.85rem', marginBottom: '1rem',
                display: 'flex', gap: '0.5rem', alignItems: 'center'
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <ColumnMapping
              uploadResult={uploadResult}
              onProcess={handleProcess}
              processing={processing}
              defaultResampleFreq={defaultResampleFreq}
            />
            <button
              id="back-step0-btn"
              onClick={() => setStep(0)}
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              Back
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Database size={22} color="var(--eco-emerald)" />
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Dataset Processed — Preview</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {previewTotal.toLocaleString()} records ingested successfully.
                  </p>
                </div>
              </div>
              <button
                id="confirm-import-btn"
                onClick={() => setDone(true)}
                className="btn btn-primary"
              >
                <CheckCircle2 size={16} /> Finalize
              </button>
            </div>
            <DataPreview
              readings={previewReadings}
              totalCount={previewTotal}
              page={previewPage}
              pageSize={50}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
