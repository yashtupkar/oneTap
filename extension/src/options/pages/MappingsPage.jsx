import React, { useState, useEffect } from 'react';
import { getDeviceId, getSettings } from '../../shared/api.js';

export default function MappingsPage() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');

  useEffect(() => {
    async function init() {
      try {
        const dId = await getDeviceId();
        setDeviceId(dId.deviceId || dId);
        
        const settingsRes = await getSettings();
        const settings = settingsRes.settings || settingsRes;
        const url = settings.serverUrl || 'http://localhost:3001';
        setServerUrl(url);

        await fetchMappings(url, dId.deviceId || dId);
      } catch (err) {
        setError('Failed to initialize: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const fetchMappings = async (url, devId) => {
    try {
      const response = await fetch(`${url}/api/autofill/mappings`, {
        headers: {
          'X-Device-ID': devId
        }
      });
      if (!response.ok) throw new Error('Failed to fetch mappings');
      const data = await response.json();
      setMappings(data.mappings || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this learned association?')) return;

    try {
      const response = await fetch(`${serverUrl}/api/autofill/mappings/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Device-ID': deviceId
        }
      });
      if (!response.ok) throw new Error('Failed to delete mapping');
      setMappings(prev => prev.filter(m => m._id !== id));
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
        <h2 className="text-2xl font-bold text-white mb-1">Learned Mappings</h2>
        <p className="text-sm text-slate-500">
          Review field associations the extension has learned from your past form submissions.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {mappings.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">
          <span className="text-3xl block mb-2">🧠</span>
          <p className="text-sm">No mappings learned yet.</p>
          <p className="text-xs text-slate-600 mt-1">Submit your first form to teach the extension matching rules.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-surface-border text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-3 pl-4">Field Fingerprint / Label</th>
                  <th className="p-3">Attributes</th>
                  <th className="p-3">Profile Match</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Activity</th>
                  <th className="p-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {mappings.map(map => {
                  const hasLabel = map.fieldDescriptor?.label || map.fieldDescriptor?.placeholder || map.fieldDescriptor?.name;
                  const confidence = Math.round(map.confidence * 100);

                  return (
                    <tr key={map._id} className="hover:bg-surface-elevated/40 transition-colors">
                      {/* Name / Label */}
                      <td className="p-3 pl-4 font-medium text-slate-200">
                        <div className="font-mono text-[10px] text-slate-500">{map.fieldFingerprint.slice(0, 8)}...</div>
                        <div className="truncate max-w-[180px]">{hasLabel || <em className="text-slate-600">Unnamed</em>}</div>
                      </td>

                      {/* Attributes */}
                      <td className="p-3 text-slate-400">
                        <div className="space-y-0.5">
                          {map.fieldDescriptor?.name && (
                            <div><span className="text-slate-600 text-[10px]">name:</span> {map.fieldDescriptor.name}</div>
                          )}
                          {map.fieldDescriptor?.type && (
                            <div><span className="text-slate-600 text-[10px]">type:</span> {map.fieldDescriptor.type}</div>
                          )}
                          {map.domain && (
                            <div className="text-[10px] text-slate-500 italic">{map.domain}</div>
                          )}
                        </div>
                      </td>

                      {/* Profile Key */}
                      <td className="p-3 font-mono text-primary-400 font-semibold">{map.profileKey}</td>

                      {/* Confidence */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${
                            confidence >= 80 ? 'text-emerald-400' : confidence >= 50 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {confidence}%
                          </span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="p-3">
                        <span className={`badge text-[10px] ${
                          map.source === 'user' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          map.source === 'ai' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {map.source}
                        </span>
                      </td>

                      {/* Activity */}
                      <td className="p-3 text-[10px] text-slate-500">
                        <div>Confirmations: {map.confirmations}</div>
                        <div>Corrections: {map.corrections}</div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 pr-4 text-right">
                        <button
                          onClick={() => handleDelete(map._id)}
                          className="btn-danger p-1.5"
                          title="Delete learned association"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
