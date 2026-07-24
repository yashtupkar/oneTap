import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, getProfile } from '../shared/api.js';

const STATUS_DOT = {
  connected: 'bg-emerald-400',
  disconnected: 'bg-red-400',
  checking: 'bg-amber-400 animate-pulse-dot',
};

export default function Popup() {
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, p] = await Promise.all([getSettings(), getProfile()]);
        setSettings(s.settings || s);
        setProfile(p.profile || null);
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
      <div className="w-72 h-40 flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  const completeness = profileCompleteness();

  return (
    <div className="w-72 bg-surface font-sans">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-sm">⚡</div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">AI Form Autofill</h1>
              <p className="text-xs text-primary-200 mt-0.5">Powered by OpenRouter</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={toggleEnabled}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
              settings?.enabled ? 'bg-white/30' : 'bg-white/10'
            }`}
            title={settings?.enabled ? 'Click to disable' : 'Click to enable'}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${
              settings?.enabled
                ? 'translate-x-5 bg-white'
                : 'translate-x-0 bg-white/40'
            }`} />
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[serverStatus]}`} />
          <span className="text-xs text-primary-100">
            {serverStatus === 'connected' ? 'Server connected' :
             serverStatus === 'checking' ? 'Connecting...' : 'Server offline'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {/* Profile completeness */}
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
            <p className="text-xs text-slate-500 mt-1.5">Complete your profile for better autofill accuracy.</p>
          )}
        </div>

        {/* Quick info */}
        {profile && (
          <div className="card flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center text-sm">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'No name set'}
              </p>
              <p className="text-xs text-slate-500 truncate">{profile.email || 'No email set'}</p>
            </div>
          </div>
        )}

        {/* Disabled warning */}
        {!settings?.enabled && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <span className="text-sm">⚠️</span>
            <span className="text-xs text-amber-400">Autofill is disabled</span>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="border-t border-surface-border p-2 grid grid-cols-3 gap-1">
        {[
          { icon: '👤', label: 'Profile', tab: 'profile' },
          { icon: '📄', label: 'Documents', tab: 'documents' },
          { icon: '⚙️', label: 'Settings', tab: 'preferences' },
        ].map(({ icon, label, tab }) => (
          <button
            key={tab}
            onClick={() => openOptions(tab)}
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg hover:bg-surface-elevated transition-colors duration-150 group"
          >
            <span className="text-base">{icon}</span>
            <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
