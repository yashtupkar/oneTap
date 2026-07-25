import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, getProfile, getDeviceId } from '../shared/api.js';

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

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, pRes, dRes] = await Promise.all([getSettings(), getProfile(), getDeviceId()]);
        const s = sRes.settings || sRes;
        setSettings(s);
        setProfile(pRes.profile || null);
        
        const did = dRes.deviceId || dRes;
        const url = s.serverUrl || 'http://localhost:3001';
        
        try {
          const docRes = await fetch(`${url}/api/documents`, { headers: { 'X-Device-ID': did } });
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
          <span className="text-xs text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  const completeness = profileCompleteness();

  const renderHome = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Profile Completeness</span>
          <span className={`text-xs font-bold ${completeness >= 80 ? 'text-emerald-400' : completeness >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {completeness}%
          </span>
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completeness >= 80 ? 'bg-emerald-400' : completeness >= 50 ? 'bg-amber-400' : 'bg-red-400'
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 70 && (
          <p className="text-[10px] text-slate-500 mt-1.5">Complete your profile for better autofill accuracy.</p>
        )}
      </div>

      {profile && (
        <div className="card flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center text-sm">👤</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'No name set'}
            </p>
            <p className="text-xs text-slate-500 truncate">{profile.email || 'No email set'}</p>
          </div>
        </div>
      )}

      {!settings?.enabled && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-sm">⚠️</span>
          <span className="text-xs text-amber-400">Autofill is disabled</span>
        </div>
      )}
    </div>
  );

  const renderProfile = () => {
    if (!profile) return <div className="text-center text-sm text-slate-500 mt-4">No profile data</div>;
    
    const filledFields = [];
    const skipKeys = ['_id', 'deviceId', 'createdAt', 'updatedAt', 'customFields'];
    for (const [key, val] of Object.entries(profile)) {
      if (!skipKeys.includes(key) && val) {
        if (Array.isArray(val) && val.length > 0) {
          filledFields.push({ label: key, value: val.join(', ') });
        } else if (typeof val === 'string' && val.trim() !== '') {
          filledFields.push({ label: key, value: val });
        }
      }
    }

    const customFields = [];
    if (profile.customFields) {
      for (const [key, cf] of Object.entries(profile.customFields)) {
        const val = typeof cf === 'object' ? cf.value : cf;
        const isSensitive = typeof cf === 'object' ? cf.sensitive : false;
        if (val) {
          customFields.push({ label: key.replace(/_/g, ' '), value: val, sensitive: isSensitive });
        }
      }
    }

    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Standard Fields</h3>
          <div className="grid grid-cols-2 gap-2">
            {filledFields.length > 0 ? filledFields.map(f => (
              <div key={f.label} className="bg-surface-elevated/30 p-2 rounded border border-surface-border overflow-hidden">
                <div className="text-[9px] text-slate-500 capitalize">{f.label.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="text-xs text-slate-200 truncate">{f.value}</div>
              </div>
            )) : <p className="text-xs text-slate-500 italic col-span-2">No standard fields filled.</p>}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Custom Fields</h3>
          <div className="space-y-2">
            {customFields.length > 0 ? customFields.map(f => (
              <div key={f.label} className="bg-surface-elevated/30 p-2 rounded border border-surface-border">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-slate-500 capitalize">{f.label}</span>
                  {f.sensitive && <span className="text-[9px] text-amber-500">🔒 Encrypted</span>}
                </div>
                <div className="text-xs text-slate-200 truncate">{f.sensitive ? '••••••••' : f.value}</div>
              </div>
            )) : <p className="text-xs text-slate-500 italic">No custom fields added.</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => {
    return (
      <div className="space-y-2 animate-fade-in">
        {documents.length > 0 ? documents.map(doc => {
          const sizeKb = Math.round(doc.sizeBytes / 102.4) / 10;
          return (
            <div key={doc._id} className="bg-surface-elevated/30 p-2 rounded border border-surface-border flex items-center gap-3 hover:bg-surface-elevated/50 transition-colors">
              <span className="text-xl">📄</span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-semibold text-slate-200 truncate">{doc.label}</div>
                  {doc.isDefault && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded ml-1 uppercase font-bold tracking-wider">Default</span>}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{doc.originalName}</div>
                <div className="text-[9px] text-slate-600 mt-0.5">{sizeKb} KB • {doc.category}</div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8">
             <span className="text-2xl mb-2 block">📂</span>
             <p className="text-xs text-slate-500 italic">No documents uploaded.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-surface font-sans flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-sm">⚡</div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">AI Form Autofill</h1>
              <p className="text-[10px] text-primary-200 mt-0.5">Powered by OpenRouter</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={toggleEnabled}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
              settings?.enabled ? 'bg-white/30' : 'bg-white/10'
            }`}
            title={settings?.enabled ? 'Click to disable' : 'Click to enable'}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${
              settings?.enabled
                ? 'translate-x-5 bg-white'
                : 'translate-x-0 bg-white/40'
            }`} />
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[serverStatus]}`} />
          <span className="text-[10px] text-primary-100 font-medium">
            {serverStatus === 'connected' ? 'Server connected' :
             serverStatus === 'checking' ? 'Connecting...' : 'Server offline'}
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-surface-border px-2 shrink-0 bg-surface-elevated/20">
        {['home', 'profile', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize border-b-2 transition-all duration-200 ${
              activeTab === tab 
                ? 'border-primary-500 text-primary-400 bg-primary-500/5' 
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'documents' && renderDocuments()}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-surface-border p-3 flex justify-between items-center bg-surface-elevated/30">
        <span className="text-xs text-slate-500 font-medium">Manage all settings</span>
        <button onClick={() => openOptions(activeTab === 'home' ? '' : activeTab)} className="btn-secondary py-1.5 px-4 text-xs font-semibold flex items-center gap-1.5">
          Open Options <span className="text-[10px]">⚙️</span>
        </button>
      </div>
    </div>
  );
}
