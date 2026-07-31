import React, { useState, useEffect } from 'react';
import { getDeviceId, getSettings, getToken } from '../../shared/api.js';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, Trash2, Database } from "lucide-react";

export default function MappingsPage() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');

  useEffect(() => {
    async function init() {
      try {
        const dId = await getDeviceId();
        setDeviceId(dId.deviceId || dId);
        
        const settingsRes = await getSettings();
        const settings = settingsRes.settings || settingsRes;
        const url = settings.serverUrl || import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
        setServerUrl(url);

        const tokenRes = await getToken();
        const t = tokenRes.token || tokenRes;
        setToken(t || null);

        await fetchMappings(url, dId.deviceId || dId, t || null);
      } catch (err) {
        setError('Failed to initialize: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const fetchMappings = async (url, devId, t = null) => {
    try {
      const headers = { 'X-Device-ID': devId };
      if (t) headers['Authorization'] = `Bearer ${t}`;

      const response = await fetch(`${url}/api/autofill/mappings`, { headers });
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
      const headers = { 'X-Device-ID': deviceId };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${serverUrl}/api/autofill/mappings/${id}`, {
        method: 'DELETE',
        headers
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">Learned Mappings</h2>
        <p className="text-muted-foreground">
          Review field associations the extension has learned from your past form submissions.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {mappings.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent>
            <Brain className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm font-medium">No mappings learned yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Submit your first form to teach the extension matching rules.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-4">
             <CardTitle className="text-base flex items-center gap-2">
               <Database className="w-4 h-4" /> Association Data
             </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Field Fingerprint / Label</th>
                  <th className="p-4">Attributes</th>
                  <th className="p-4">Profile Match</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Activity</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {mappings.map(map => {
                  const hasLabel = map.fieldDescriptor?.label || map.fieldDescriptor?.placeholder || map.fieldDescriptor?.name;
                  const confidence = Math.round(map.confidence * 100);

                  return (
                    <tr key={map._id} className="hover:bg-muted/50 transition-colors">
                      {/* Name / Label */}
                      <td className="p-4 font-medium text-foreground">
                        <div className="font-mono text-xs text-muted-foreground mb-1">{map.fieldFingerprint.slice(0, 8)}...</div>
                        <div className="truncate max-w-[180px]">{hasLabel || <em className="text-muted-foreground">Unnamed</em>}</div>
                      </td>

                      {/* Attributes */}
                      <td className="p-4 text-muted-foreground text-xs">
                        <div className="space-y-1">
                          {map.fieldDescriptor?.name && (
                            <div><span className="font-semibold mr-1">name:</span> {map.fieldDescriptor.name}</div>
                          )}
                          {map.fieldDescriptor?.type && (
                            <div><span className="font-semibold mr-1">type:</span> {map.fieldDescriptor.type}</div>
                          )}
                          {map.domain && (
                            <div className="text-muted-foreground/70 italic mt-1">{map.domain}</div>
                          )}
                        </div>
                      </td>

                      {/* Profile Key */}
                      <td className="p-4 font-mono text-primary font-semibold text-xs">{map.profileKey}</td>

                      {/* Confidence */}
                      <td className="p-4">
                        <span className={`font-semibold ${
                          confidence >= 80 ? 'text-emerald-500' : confidence >= 50 ? 'text-amber-500' : 'text-destructive'
                        }`}>
                          {confidence}%
                        </span>
                      </td>

                      {/* Source */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          map.source === 'user' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          map.source === 'ai' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                          'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {map.source?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>

                      {/* Activity */}
                      <td className="p-4 text-xs text-muted-foreground space-y-1">
                        <div><span className="font-semibold">Confirmations:</span> {map.confirmations}</div>
                        <div><span className="font-semibold">Corrections:</span> {map.corrections}</div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(map._id)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Delete mapping"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
