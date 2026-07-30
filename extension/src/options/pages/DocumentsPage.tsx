import React, { useState, useEffect } from 'react';
import { documentLibrary, DocumentMetadata } from '../../background/documents/DocumentLibrary';
import { graphStore } from '../../core/GraphStore';
import { Profile } from '../../core/schema';

const DOCUMENT_CATEGORIES = [
  { value: 'resume', label: 'Resume', icon: '📄' },
  { value: 'cover_letter', label: 'Cover Letter', icon: '✉️' },
  { value: 'portfolio', label: 'Portfolio / Samples', icon: '🎨' },
  { value: 'certification', label: 'Certification', icon: '📜' },
  { value: 'id', label: 'Identification (ID)', icon: '🪪' },
  { value: 'other', label: 'Other', icon: '📎' },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('resume');
  const [targetRole, setTargetRole] = useState('');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setLoading(true);
      await graphStore.init();
      
      const allProfiles = await graphStore.getAll<Profile>('profiles');
      if (allProfiles.length > 0) {
        setProfile(allProfiles[0]);
        await fetchDocs(allProfiles[0].id);
      }
    } catch (err: any) {
      setError('Failed to load documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async (profileId: string) => {
    try {
      const docs = await documentLibrary.getDocumentsForProfile(profileId);
      // Sort newest first
      setDocuments(docs.sort((a, b) => b.uploadedAt - a.uploadedAt));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !profile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await documentLibrary.uploadDocument(profile.id, file, category, targetRole);
      
      // Reset form
      setFile(null);
      setTargetRole('');
      const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Re-fetch docs
      await fetchDocs(profile.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile) return;
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Direct deletion from GraphStore for now
      await graphStore.init();
      const db = (graphStore as any).db as IDBDatabase;
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      store.delete(id);
      
      tx.oncomplete = () => {
        setDocuments(prev => prev.filter(d => d.id !== id));
      };
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-primary-500">
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 text-gray-100 font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Document Library</h2>
        <p className="text-sm text-gray-400 mt-1">Upload resumes and portfolios. The AI will parse them locally and map skills into your Graph.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 h-fit shadow-sm">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-wider">
            <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload New File
          </h3>
          <form onSubmit={handleUpload} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Document File</label>
              <input
                id="doc-file-input"
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-xl file:border-0
                  file:text-xs file:font-bold file:uppercase file:tracking-wider
                  file:bg-primary-500/10 file:text-primary-400
                  hover:file:bg-primary-500/20 file:cursor-pointer cursor-pointer transition-colors"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="text-[10px] text-gray-500 mt-1">Accepted: PDF, DOCX, JPG, PNG (Max 10MB)</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Document Type</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              >
                {DOCUMENT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Role (Optional)</label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {uploading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Upload & Parse'
              )}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 pl-1">
            Uploaded Documents ({documents.length})
          </h3>

          {documents.length === 0 ? (
            <div className="bg-surface-card border border-surface-border border-dashed rounded-2xl text-center py-16 text-gray-500 flex flex-col items-center">
              <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="font-medium text-gray-300">No documents yet.</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Upload a resume on the left to start extracting skills into your graph.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {documents.map(doc => {
                const catInfo = DOCUMENT_CATEGORIES.find(c => c.value === doc.type) || { label: doc.type, icon: '📎' };
                
                return (
                  <div key={doc.id} className="bg-surface-card border border-surface-border hover:border-primary-500/50 rounded-2xl p-5 transition-colors group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 overflow-hidden">
                      <div className="text-3xl bg-surface-elevated w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        {catInfo.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-sm font-semibold text-white truncate">{doc.name}</h4>
                          <span className="bg-primary-500/10 text-primary-400 border border-primary-500/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                            v{doc.version}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate flex items-center gap-2">
                          <span>{catInfo.label}</span>
                          {doc.targetRole && (
                            <>
                              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                              <span className="text-gray-300 font-medium">{doc.targetRole}</span>
                            </>
                          )}
                        </p>
                        
                        {/* Extracted Skills Badges */}
                        {doc.skills && doc.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            <span className="text-[10px] text-gray-500 font-medium mr-1 self-center">AI Parsed:</span>
                            {doc.skills.slice(0, 4).map((skill, i) => (
                              <span key={i} className="text-[10px] bg-surface-elevated text-gray-300 px-2 py-0.5 rounded border border-surface-border">
                                {skill}
                              </span>
                            ))}
                            {doc.skills.length > 4 && (
                              <span className="text-[10px] text-gray-500 self-center">+{doc.skills.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {doc.blobUrl && (
                        <a
                          href={doc.blobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none text-center bg-surface-elevated hover:bg-surface-border text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors border border-surface-border flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="bg-surface-elevated hover:bg-red-500/10 text-gray-400 hover:text-red-400 hover:border-red-500/20 py-2 px-3 rounded-lg transition-colors border border-surface-border"
                        title="Delete document"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
