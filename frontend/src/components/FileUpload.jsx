import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function FileUpload({ onFileUploaded, onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    const validExts = ['.csv', '.txt', '.xlsx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExts.includes(ext)) {
      setError(`Invalid file format '${ext}'. Please upload .csv, .txt, or .xlsx files.`);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploading(true);

    try {
      const res = await api.uploadFile(file);
      if (onFileUploaded) onFileUploaded(file, res);
      if (onUploadSuccess) onUploadSuccess(res);
    } catch (err) {
      setError(err.message || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept=".csv,.txt,.xlsx"
        style={{ display: 'none' }}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--electric-blue)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.01)',
          transition: 'all 0.25s ease'
        }}
      >
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto'
        }}>
          {uploading ? (
            <Loader2 size={30} color="var(--electric-blue)" className="animate-spin" />
          ) : (
            <UploadCloud size={30} color="var(--electric-blue)" />
          )}
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          {uploading ? 'Analyzing Dataset Schema...' : 'Drag and Drop Energy Dataset Here'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Supports <strong>UCI Household Power Consumption</strong>, Smart Meter CSVs, TXT (semicolon/comma), and Excel (.xlsx) up to 100MB.
        </p>

        <button type="button" className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
          <FileText size={16} />
          <span>Browse File from Computer</span>
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '1.25rem',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: 'var(--alert-rose)',
          fontSize: '0.85rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
