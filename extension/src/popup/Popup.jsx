import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, getProfile, updateProfile, getDeviceId, getToken, login, register, logout } from '../shared/api.js';

const STATUS_DOT = {
  connected: 'bg-emerald-400',
  disconnected: 'bg-red-400',
  checking: 'bg-amber-400 animate-pulse-dot',
};

export default function Popup() {
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  const [token, setToken] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Field Edit/Add state
  const [editingField, setEditingField] = useState(null);
  const [editFieldValue, setEditFieldValue] = useState('');
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  
  // Doc Add state
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docLabel, setDocLabel] = useState('');
  const [docCategory, setDocCategory] = useState('resume');
  const [docUploading, setDocUploading] = useState(false);
  
  // Status stats mock
  const [fieldsResolved] = useState(3);

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, pRes, dRes, tRes] = await Promise.all([getSettings(), getProfile(), getDeviceId(), getToken()]);
        const s = sRes.settings || sRes;
        setSettings(s);
        setProfile(pRes.profile || null);
        setToken(tRes.token || null);
        
        const did = dRes.deviceId || dRes;
        const url = s.serverUrl || 'http://localhost:3001';
        
        try {
          const headers = { 'X-Device-ID': did };
          if (tRes.token) headers['Authorization'] = `Bearer ${tRes.token}`;
          const docRes = await fetch(`${url}/api/documents`, { headers });
          if (docRes.ok) {
            const docData = await docRes.json();
            setDocuments(docData.documents || []);
          }
        } catch (e) {
          // ignore doc fetch error
        }

        setServerStatus('connected');
      } catch (err) {
        setServerStatus('disconnected');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleEnabled = async () => {
    const newSettings = { ...settings, enabled: !settings.enabled };
    setSettings(newSettings);
    await updateSettings(newSettings);
  };

  const openOptions = (tab = '') => {
    chrome.tabs.create({
      url: chrome.runtime.getURL(`options/index.html${tab ? `#${tab}` : ''}`),
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      let res;
      if (authMode === 'login') {
        res = await login(authEmail, authPassword);
      } else {
        const did = await getDeviceId();
        res = await register(authEmail, authPassword, did.deviceId || did);
      }
      if (res.error) {
        setAuthError(res.error);
      } else if (res.token) {
        setToken(res.token);
        // Reload data
        const [pRes, dRes] = await Promise.all([getProfile(), getDeviceId()]);
        setProfile(pRes.profile || null);
        const did = dRes.deviceId || dRes;
        const s = settings || { serverUrl: 'http://localhost:3001' };
        try {
          const docRes = await fetch(`${s.serverUrl}/api/documents`, { headers: { 'X-Device-ID': did, 'Authorization': `Bearer ${res.token}` } });
          if (docRes.ok) {
            const docData = await docRes.json();
            setDocuments(docData.documents || []);
          }
        } catch (err) {}
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setToken(null);
    setProfile(null);
    setDocuments([]);
  };

  const handleUpdateField = async (key, value, isCustom = false) => {
    if (!profile) return;
    try {
      let updatedProfile = { ...profile };
      if (isCustom) {
        updatedProfile.customFields = {
          ...updatedProfile.customFields,
          [key]: { value, type: 'text', sensitive: false }
        };
      } else {
        updatedProfile[key] = value;
      }
      setProfile(updatedProfile);
      await updateProfile(updatedProfile);
      setEditingField(null);
    } catch (err) {
      console.error('Failed to update field', err);
    }
  };

  const handleDeleteField = async (key, isCustom = false) => {
    if (!profile) return;
    try {
      let updatedProfile = { ...profile };
      if (isCustom) {
        const newCustomFields = { ...updatedProfile.customFields };
        delete newCustomFields[key];
        updatedProfile.customFields = newCustomFields;
      } else {
        updatedProfile[key] = '';
      }
      setProfile(updatedProfile);
      await updateProfile(updatedProfile);
    } catch (err) {
      console.error('Failed to delete field', err);
    }
  };

  const handleAddField = async () => {
    if (!newFieldKey.trim() || !newFieldValue.trim()) return;
    const key = newFieldKey.toLowerCase().trim().replace(/[\s\W]+/g, '_');
    await handleUpdateField(key, newFieldValue, true);
    setNewFieldKey('');
    setNewFieldValue('');
    setShowAddField(false);
  };

  const fetchDocs = async () => {
    try {
      const dIdRes = await getDeviceId();
      const did = dIdRes.deviceId || dIdRes;
      const s = settings || { serverUrl: 'http://localhost:3001' };
      const headers = { 'X-Device-ID': did };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const docRes = await fetch(`${s.serverUrl}/api/documents`, { headers });
      if (docRes.ok) {
        const docData = await docRes.json();
        setDocuments(docData.documents || []);
      }
    } catch (err) {}
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile || !docLabel.trim()) return;
    setDocUploading(true);
    try {
      const dIdRes = await getDeviceId();
      const did = dIdRes.deviceId || dIdRes;
      const s = settings || { serverUrl: 'http://localhost:3001' };
      const headers = { 'X-Device-ID': did };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('category', docCategory);
      formData.append('label', docLabel);
      formData.append('isDefault', true);

      await fetch(`${s.serverUrl}/api/documents`, {
        method: 'POST',
        headers,
        body: formData
      });
      setDocFile(null);
      setDocLabel('');
      setShowAddDoc(false);
      await fetchDocs();
    } catch (err) {
      console.error('Failed to upload doc', err);
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Delete document?')) return;
    try {
      const dIdRes = await getDeviceId();
      const did = dIdRes.deviceId || dIdRes;
      const s = settings || { serverUrl: 'http://localhost:3001' };
      const headers = { 'X-Device-ID': did };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${s.serverUrl}/api/documents/${id}`, {
        method: 'DELETE',
        headers
      });
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      console.error('Failed to delete doc', err);
    }
  };

  const profileCompleteness = () => {
    if (!profile) return 0;
    const fields = ['firstName', 'email', 'phone', 'city', 'country', 'currentJobTitle', 'skills'];
    const filled = fields.filter(k => profile[k] && profile[k].length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="w-80 h-64 flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-500">Loading...</span>
        </div>
      </div>
    );
  }

  const completeness = profileCompleteness();

  const renderAuth = () => (
    <div className="w-[360px] flex flex-col h-[450px] justify-center px-6 bg-surface animate-fade-in relative z-50 font-sans rounded-lg overflow-hidden text-zinc-200">
      <div className="text-center mb-6">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-3   ">
          <img src="/icons/icon48.png" alt="App Icon" className="w-full h-full object-contain " />
        </div>
        <h2 className="text-lg font-bold text-zinc-100">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-[10px] text-zinc-400 mt-1">
          {authMode === 'login' ? 'Log in to access your secure profiles' : 'Sign up to sync your data securely'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {authError && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[10px] text-center">
            {authError}
          </div>
        )}
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Email</label>
          <input
            type="email"
            required
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Password</label>
          <input
            type="password"
            required
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            placeholder="••••••••"
          />
        </div>
        
        <button
          type="submit"
          disabled={authLoading}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-2 rounded text-xs transition-colors disabled:opacity-50 mt-2"
        >
          {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="mt-5 text-center">
        <button
          onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
          className="text-[10px] text-primary-400 hover:text-primary-300 hover:underline"
        >
          {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );

  if (!token) {
    return renderAuth();
  }


  const renderHome = () => (
    <div className="space-y-4 animate-fade-in">
      {/* Profile Completeness */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-3 ">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-bold text-zinc-100">Profile completeness</span>
          <span className={`text-[13px] font-bold ${completeness === 100 ? 'text-emerald-400' : completeness >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {completeness}%
          </span>
        </div>
        <div className="flex gap-1 h-1 mb-3">
          {Array.from({ length: 16 }).map((_, i) => {
            const filledCount = Math.round((completeness / 100) * 16);
            return (
              <div 
                key={i} 
                className={`flex-1 rounded-sm ${i < filledCount ? 'bg-emerald-400' : 'bg-surface-elevated'}`} 
              />
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">
          {Math.round((completeness / 100) * 16)} / 16 standard fields on file
        </p>
      </div>

      {/* User Info */}
      {profile && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-2 flex items-center gap-4 ">
          <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-lg font-bold text-white ">
            {profile.firstName ? profile.firstName[0] : 'Y'}{profile.lastName ? profile.lastName[0] : 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-zinc-100 truncate">
              {profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'No name set'}
            </p>
            <p className="text-[11px] text-zinc-400 font-mono truncate">{profile.email || 'No email set'}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 bg-surface-card hover:bg-surface-elevated border border-surface-border rounded-lg p-1 flex flex-col items-start justify-center gap-3 transition-colors ">
          <span className="text-[13px] mx-auto font-bold text-zinc-100">Fill this page</span>
        </button>
        <button onClick={() => { setActiveTab('profile'); setShowAddField(true); }} className="flex-1  bg-surface-card hover:bg-surface-elevated border border-surface-border rounded-lg p-1 flex flex-col items-start justify-center gap-3 transition-colors ">
          <span className="text-[13px] mx-auto font-bold text-zinc-100 ">Add field</span>
        </button>
      </div>

   
    </div>
  );

  const renderProfile = () => {
    if (!profile) return <div className="text-center text-sm text-zinc-500 mt-4">No profile data</div>;
    
    const filledFields = [];
    const skipKeys = ['_id', 'deviceId', 'createdAt', 'updatedAt', 'customFields'];
    for (const [key, val] of Object.entries(profile)) {
      if (!skipKeys.includes(key) && val) {
        if (Array.isArray(val) && val.length > 0) {
          filledFields.push({ rawKey: key, label: key, value: val.join(', ') });
        } else if (typeof val === 'string' && val.trim() !== '') {
          filledFields.push({ rawKey: key, label: key, value: val });
        }
      }
    }

    const customFields = [];
    if (profile.customFields) {
      for (const [key, cf] of Object.entries(profile.customFields)) {
        const val = typeof cf === 'object' ? cf.value : cf;
        const isSensitive = typeof cf === 'object' ? cf.sensitive : false;
        if (val) {
          customFields.push({ rawKey: key, label: key.replace(/_/g, ' '), value: val, sensitive: isSensitive });
        }
      }
    }

    const renderField = (f, isCustom) => {
      const isEditing = editingField === f.rawKey;
      return (
        <div key={f.rawKey} className="bg-surface-card p-3 rounded-xl border border-surface-border flex items-center justify-between group  transition-all">
          {isEditing ? (
            <div className="flex-1 flex gap-2 items-center">
              <input type="text" className="flex-1 bg-surface-elevated border border-primary-500 rounded px-2 py-1.5 text-[13px] text-zinc-200 outline-none" value={editFieldValue} onChange={e => setEditFieldValue(e.target.value)} autoFocus />
              <button onClick={() => handleUpdateField(f.rawKey, editFieldValue, isCustom)} className="text-emerald-400 text-xs font-bold hover:text-emerald-300">Save</button>
              <button onClick={() => setEditingField(null)} className="text-zinc-400 text-xs hover:text-zinc-200">Cancel</button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-0.5">{f.label.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="text-[13px] text-zinc-200 truncate">{f.sensitive ? '••••••••' : f.value}</div>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                <button onClick={() => { setEditingField(f.rawKey); setEditFieldValue(f.value); }} className="text-zinc-400 hover:text-primary-400 transition-colors" title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => handleDeleteField(f.rawKey, isCustom)} className="text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6 animate-fade-in pb-4">
        {showAddField && (
           <div className="bg-surface-card p-4 rounded-xl   mb-4">
             <h4 className="text-[13px] font-bold text-zinc-100 mb-3">Add Custom Field</h4>
             <input type="text" placeholder="Field Name (e.g. Employee ID)" className="w-full bg-surface-elevated border border-surface-border rounded-lg p-2.5 mb-3 text-[13px] text-zinc-200 outline-none focus:border-primary-500" value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)} />
             <input type="text" placeholder="Value" className="w-full bg-surface-elevated border border-surface-border rounded-lg p-2.5 mb-4 text-[13px] text-zinc-200 outline-none focus:border-primary-500" value={newFieldValue} onChange={e => setNewFieldValue(e.target.value)} />
             <div className="flex gap-3 justify-end items-center">
               <button onClick={() => setShowAddField(false)} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
               <button onClick={handleAddField} className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-colors">Save Field</button>
             </div>
           </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Standard Fields</h3>
            {!showAddField && <button onClick={() => setShowAddField(true)} className="text-[10px] font-bold text-primary-500 hover:text-primary-400 uppercase tracking-widest">+ Add</button>}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {filledFields.length > 0 ? filledFields.map(f => renderField(f, false)) : <p className="text-[11px] text-zinc-500 italic px-1">No standard fields filled.</p>}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-3 px-1">Custom Fields</h3>
          <div className="grid grid-cols-1 gap-2">
            {customFields.length > 0 ? customFields.map(f => renderField(f, true)) : <p className="text-[11px] text-zinc-500 italic px-1">No custom fields added.</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => {
    return (
      <div className="space-y-4 animate-fade-in pb-4">
        {showAddDoc && (
           <div className="bg-surface-card p-4 rounded-xl   mb-4">
             <h4 className="text-[13px] font-bold text-zinc-100 mb-3">Upload Document</h4>
             <input type="text" placeholder="Label (e.g. My Resume)" className="w-full bg-surface-elevated border border-surface-border rounded-lg p-2.5 mb-3 text-[13px] text-zinc-200 outline-none focus:border-primary-500" value={docLabel} onChange={e => setDocLabel(e.target.value)} />
             <input type="file" className="w-full text-[11px] text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-surface-elevated file:text-zinc-200 hover:file:bg-surface-border mb-4 cursor-pointer" onChange={e => setDocFile(e.target.files[0])} />
             <div className="flex gap-3 justify-end items-center">
               <button onClick={() => setShowAddDoc(false)} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
               <button onClick={handleUploadDoc} disabled={docUploading || !docFile || !docLabel} className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                 {docUploading ? 'Uploading...' : 'Upload'}
               </button>
             </div>
           </div>
        )}

        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Your Documents</h3>
          {!showAddDoc && <button onClick={() => setShowAddDoc(true)} className="text-[10px] font-bold text-primary-500 hover:text-primary-400 uppercase tracking-widest">+ Add</button>}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {documents.length > 0 ? documents.map(doc => {
            const sizeKb = Math.round(doc.sizeBytes / 102.4) / 10;
            return (
              <div key={doc._id} className="bg-surface-card p-3 rounded-xl border border-surface-border flex items-center justify-between group  transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center text-primary-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-zinc-200 truncate">{doc.label}</span>
                      {doc.isDefault && <span className="text-[9px] bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Default</span>}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{doc.originalName} • {sizeKb} KB</div>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                  <button onClick={() => handleDeleteDoc(doc._id)} className="text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            );
          }) : (
            <button onClick={() => setShowAddDoc(true)} className="w-full p-6 rounded-xl border-2 border-dashed border-surface-border hover:border-primary-500/50 flex flex-col items-center justify-center gap-2 group transition-colors">
               <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-zinc-400 group-hover:text-primary-500 group-hover:bg-primary-500/10 transition-colors">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
               </div>
               <span className="text-[13px] font-bold text-zinc-400 group-hover:text-zinc-200">Add document</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[360px] bg-surface rounded-lg overflow-hidden font-sans flex flex-col h-[450px] text-zinc-200">
      {/* Header */}
      <div className="px-4 pt-4 shrink-0 bg-surface">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center bg-indigo-500 justify-center  p-2">
              <img src="/icons/icon48.png" alt="App Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-zinc-100 leading-tight">OneTap</h1>
              <p className="text-[10px] text-zinc-500 mt-0.5 tracking-widest font-mono uppercase">AI Form Autofill</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
     
            {/* Toggle */}
            <button
              onClick={toggleEnabled}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                settings?.enabled ? 'bg-primary-500' : 'bg-surface-border'
              }`}
              title={settings?.enabled ? 'Disable' : 'Enable'}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                settings?.enabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[serverStatus]}`} />
          <span className="text-zinc-400">
            {serverStatus === 'connected' ? `Server connected ` :
             serverStatus === 'checking' ? 'Connecting...' : 'Server offline'}
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-surface-border px-4 shrink-0 bg-surface">
        {['home', 'profile', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-semibold capitalize border-b-2 transition-all duration-200 ${
              activeTab === tab 
                ? 'border-primary-500 text-primary-500' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-surface text-zinc-300">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'documents' && renderDocuments()}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-surface-border p-4 flex justify-between items-center bg-surface">
        <span className="text-xs text-zinc-500">Manage all settings</span>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1.5 transition-colors">
            Log out
          </button>
          <button onClick={() => openOptions(activeTab === 'home' ? '' : activeTab)} className="bg-surface-elevated hover:bg-surface-border text-zinc-200 border border-surface-border py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Options
          </button>
        </div>
      </div>
    </div>
  );
}
