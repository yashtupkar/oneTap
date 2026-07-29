import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../shared/api.js';

export default function PreferencesPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings()
      .then(res => setSettings(res.settings || res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      await updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Preferences</h2>
        <p className="text-sm text-slate-500">Configure autofill behavior, AI provider settings, and security controls.</p>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
          ✓ Preferences saved successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-surface-border pb-2 mb-3">
            ⚙️ General Settings
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-200 block">Enable Autofill</label>
              <span className="text-xs text-slate-500">Turn autofill overlay badges and auto-filling on or off globally.</span>
            </div>
            <button
              type="button"
              onClick={() => handleChange('enabled', !settings.enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                settings.enabled ? 'bg-primary-600' : 'bg-slate-700'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                settings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-200 block">Show Visual Overlays</label>
              <span className="text-xs text-slate-500">Display the small status/confidence badge beside form fields.</span>
            </div>
            <button
              type="button"
              onClick={() => handleChange('showOverlays', !settings.showOverlays)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                settings.showOverlays ? 'bg-primary-600' : 'bg-slate-700'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                settings.showOverlays ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Security & Confirmation */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-surface-border pb-2 mb-3">
            🛡️ Security & Approvals
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-200 block">Confirm sensitive fields</label>
              <span className="text-xs text-slate-500">Always ask for confirmation before filling sensitive identity fields.</span>
            </div>
            <button
              type="button"
              onClick={() => handleChange('askBeforeSensitiveFields', !settings.askBeforeSensitiveFields)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                settings.askBeforeSensitiveFields ? 'bg-primary-600' : 'bg-slate-700'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                settings.askBeforeSensitiveFields ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-200 block">Confirm file attachments</label>
              <span className="text-xs text-slate-500">Always prompt before filling file input selectors with saved documents.</span>
            </div>
            <button
              type="button"
              onClick={() => handleChange('askBeforeFileUpload', !settings.askBeforeFileUpload)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                settings.askBeforeFileUpload ? 'bg-primary-600' : 'bg-slate-700'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                settings.askBeforeFileUpload ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* AI Integration & Keys */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-surface-border pb-2 mb-3">
            🤖 AI Engine Setup (OpenRouter)
          </h3>

          <div>
            <label className="label">OpenRouter API Key (Optional)</label>
            <input
              type="password"
              value={settings.openrouterApiKey || ''}
              onChange={e => handleChange('openrouterApiKey', e.target.value)}
              placeholder="sk-or-v1-..."
              className="input font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              If not provided, the extension will fall back to the server-configured API key for semantic matching.
            </p>
          </div>

          <div>
            <label className="label">Backend Connection URL</label>
            <input
              type="url"
              value={settings.serverUrl || ''}
              onChange={e => handleChange('serverUrl', e.target.value)}
              placeholder="https://onetap-8arx.onrender.com"
              className="input"
            />
            <p className="text-xs text-slate-500 mt-1">
              The address of your AI Form Autofill local Express server.
            </p>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
