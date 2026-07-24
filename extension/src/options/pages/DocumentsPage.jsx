import React, { useState, useEffect } from 'react';
import { getDeviceId, getSettings } from '../../shared/api.js';
import { DOCUMENT_CATEGORIES } from '../../shared/constants.js';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');

  // Form states
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('resume');
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const dId = await getDeviceId();
        setDeviceId(dId.deviceId || dId);
        
        const settingsRes = await getSettings();
        const settings = settingsRes.settings || settingsRes;
        const url = settings.serverUrl || 'http://localhost:3001';
        setServerUrl(url);

        await fetchDocs(url, dId.deviceId || dId);
      } catch (err) {
        setError('Failed to initialize: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const fetchDocs = async (url, devId) => {
    try {
      const response = await fetch(`${url}/api/documents`, {
        headers: {
          'X-Device-ID': devId
        }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected && !label) {
      // Auto-populate label with filename minus extension
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "");
      setLabel(nameWithoutExt);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (!label.trim()) {
      setError('Please enter a label for the document');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('label', label);
    formData.append('isDefault', isDefault);

    try {
      const response = await fetch(`${serverUrl}/api/documents`, {
        method: 'POST',
        headers: {
          'X-Device-ID': deviceId
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Upload failed');
      }

      // Reset form
      setFile(null);
      setLabel('');
      // Reset input element
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';

      // Re-fetch docs
      await fetchDocs(serverUrl, deviceId);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`${serverUrl}/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Device-ID': deviceId
        }
      });
      if (!response.ok) throw new Error('Failed to delete document');
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetDefault = async (doc) => {
    try {
      const response = await fetch(`${serverUrl}/api/documents/${doc._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': deviceId
        },
        body: JSON.stringify({ isDefault: true, category: doc.category })
      });
      if (!response.ok) throw new Error('Failed to update default');
      await fetchDocs(serverUrl, deviceId);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Manage Documents</h2>
        <p className="text-sm text-slate-500">Upload resumes, cover letters, and identification cards to fill file attachment fields.</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="card md:col-span-1 h-fit">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span>📥</span> Upload New Document
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="label">File</label>
              <input
                id="doc-file-input"
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-400
                  file:mr-3 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-xs file:font-semibold
                  file:bg-primary-600/10 file:text-primary-400
                  hover:file:bg-primary-600/20 file:cursor-pointer cursor-pointer"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="text-[10px] text-slate-500 mt-1">Accepted: PDF, DOC, DOCX, JPG, PNG. Max 10MB.</p>
            </div>

            <div>
              <label className="label">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input"
              >
                {DOCUMENT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Label / Name</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Yash Resume 2026"
                className="input"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-default"
                checked={isDefault}
                onChange={e => setIsDefault(e.target.checked)}
                className="rounded bg-surface border-surface-border text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              <label htmlFor="is-default" className="text-xs text-slate-300 select-none cursor-pointer">
                Set as default for this category
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="md:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-slate-200 mb-2">
            📄 Uploaded Documents ({documents.length})
          </h3>

          {documents.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">
              <span className="text-3xl block mb-2">📂</span>
              <p className="text-sm">No documents uploaded yet.</p>
              <p className="text-xs text-slate-600 mt-1">Upload files on the left to start auto-filling file inputs.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => {
                const catInfo = DOCUMENT_CATEGORIES.find(c => c.value === doc.category) || { label: doc.category, icon: '📎' };
                const sizeKb = Math.round(doc.sizeBytes / 102.4) / 10;
                
                return (
                  <div key={doc._id} className="card flex items-center justify-between gap-4 p-4 hover:border-slate-700 transition-all duration-150">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl mt-0.5">{catInfo.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-slate-200 truncate">{doc.label}</h4>
                          {doc.isDefault && (
                            <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{doc.originalName}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {sizeKb} KB • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!doc.isDefault && (
                        <button
                          onClick={() => handleSetDefault(doc)}
                          className="btn-secondary py-1 px-2.5 text-xs hover:border-emerald-500/40 hover:text-emerald-400"
                        >
                          Make Default
                        </button>
                      )}
                      <a
                        href={`${serverUrl}/api/documents/${doc._id}/download?deviceId=${deviceId}`}
                        download
                        className="btn-secondary py-1 px-2.5 text-xs hover:border-primary-500/40 hover:text-primary-400 flex items-center gap-1"
                        target="_blank"
                        rel="noreferrer"
                      >
                        ⬇️ Download
                      </a>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="btn-danger p-1.5"
                        title="Delete document"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
