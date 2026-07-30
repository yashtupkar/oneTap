import React, { useState, useEffect } from 'react';

export default function PreferencesPage() {
  const [settings, setSettings] = useState({
    enabled: true,
    showOverlays: true,
    askBeforeSensitiveFields: true,
    askBeforeFileUpload: true,
    openrouterApiKey: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    chrome.storage.local.get(['extension_settings'], (result) => {
      if (result.extension_settings) {
        setSettings(prev => ({ ...prev, ...result.extension_settings }));
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      await chrome.storage.local.set({ extension_settings: settings });
      
      // Notify background worker of settings change
      chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
    <div className="max-w-3xl mx-auto p-6 text-gray-100 font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Preferences</h2>
        <p className="text-sm text-gray-400 mt-1">Configure autofill behavior, AI provider settings, and security controls.</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Preferences saved successfully!
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            General Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-surface-border">
              <div>
                <label className="text-sm font-medium text-white block">Enable Autofill</label>
                <span className="text-xs text-gray-500">Turn autofill overlay badges and auto-filling on or off globally.</span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('enabled', !settings.enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  settings.enabled ? 'bg-primary-500' : 'bg-surface-border'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-white block">Show Visual Overlays</label>
                <span className="text-xs text-gray-500">Display the small status/confidence badge beside form fields.</span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('showOverlays', !settings.showOverlays)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  settings.showOverlays ? 'bg-primary-500' : 'bg-surface-border'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.showOverlays ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Security & Confirmation */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security & Approvals
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-surface-border">
              <div>
                <label className="text-sm font-medium text-white block">Confirm sensitive fields</label>
                <span className="text-xs text-gray-500">Always ask for confirmation before filling encrypted identity fields.</span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('askBeforeSensitiveFields', !settings.askBeforeSensitiveFields)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  settings.askBeforeSensitiveFields ? 'bg-primary-500' : 'bg-surface-border'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.askBeforeSensitiveFields ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-white block">Confirm file attachments</label>
                <span className="text-xs text-gray-500">Always prompt before filling file input selectors with saved documents.</span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('askBeforeFileUpload', !settings.askBeforeFileUpload)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  settings.askBeforeFileUpload ? 'bg-primary-500' : 'bg-surface-border'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.askBeforeFileUpload ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* AI Integration */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            AI Engine Setup (OpenRouter)
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">OpenRouter API Key (Optional)</label>
            <input
              type="password"
              value={settings.openrouterApiKey || ''}
              onChange={e => handleChange('openrouterApiKey', e.target.value)}
              placeholder="sk-or-v1-..."
              className="bg-surface border border-surface-border rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              If provided, the extension will perform AI Autofill mapping directly from your browser without using the backend server.
            </p>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-8 rounded-xl transition-colors shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
