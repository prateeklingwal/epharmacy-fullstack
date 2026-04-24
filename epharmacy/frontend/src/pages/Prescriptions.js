import React, { useState, useEffect } from 'react';
import { getMyPrescriptions, uploadPrescription } from '../api';
import toast from 'react-hot-toast';
import './Prescriptions.css';

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile]       = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    getMyPrescriptions().then(r => setPrescriptions(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleUpload = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('prescription', file);
      await uploadPrescription(fd);
      toast.success('Prescription uploaded!');
      setFile(null);
      load();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const STATUS_META = {
    pending:  { color: 'badge-amber', icon: '⏳' },
    approved: { color: 'badge-green', icon: '✅' },
    rejected: { color: 'badge-coral', icon: '❌' },
  };

  return (
    <div className="presc-page page-container fade-up">
      <h1 className="section-title">My Prescriptions</h1>
      <p className="section-sub">Upload prescriptions for prescription-required medicines</p>

      {/* Upload zone */}
      <div className="card presc-upload">
        <h3>Upload New Prescription</h3>
        <p>Accepted formats: JPG, PNG, PDF (max 5MB)</p>
        <div className="upload-zone" style={{ marginTop: 16 }}>
          <input type="file" id="presc-file" accept=".jpg,.jpeg,.png,.pdf"
            onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
          <label htmlFor="presc-file" className="upload-label">
            <span className="upload-icon">📁</span>
            <span>{file ? file.name : 'Click to select prescription file'}</span>
          </label>
        </div>
        {file && (
          <button className="btn btn-primary" onClick={handleUpload} disabled={uploading} style={{ marginTop: 14 }}>
            {uploading ? 'Uploading…' : '⬆️ Upload Prescription'}
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Uploaded Prescriptions</h3>
        {loading
          ? <div className="spinner-wrap"><div className="spinner" /></div>
          : prescriptions.length === 0
          ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No prescriptions yet</h3>
              <p>Upload a prescription above to get started</p>
            </div>
          )
          : (
            <div className="presc-list">
              {prescriptions.map(p => {
                const meta = STATUS_META[p.status];
                return (
                  <div key={p.id} className="presc-item card">
                    <div className="pi-icon">📄</div>
                    <div className="pi-info">
                      <div className="pi-name">{p.file_name || `Prescription #${p.id}`}</div>
                      <div className="pi-date">
                        Uploaded {new Date(p.uploaded_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </div>
                      {p.notes && <div className="pi-notes">📝 {p.notes}</div>}
                    </div>
                    <div className="pi-right">
                      <span className={`badge ${meta.color}`}>{meta.icon} {p.status}</span>
                      <a href={p.file_url} target="_blank" rel="noreferrer"
                        className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
                        View
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
