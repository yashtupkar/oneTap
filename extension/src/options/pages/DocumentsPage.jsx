import React, { useState, useEffect } from 'react';
import { getDeviceId, getSettings, getToken } from '../../shared/api.js';
import { DOCUMENT_CATEGORIES } from '../../shared/constants.js';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, Download, Trash2, CheckCircle2 } from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [token, setToken] = useState(null);
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
        const url = settings.serverUrl || import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
        setServerUrl(url);

        const tokenRes = await getToken();
        const t = tokenRes.token || tokenRes;
        setToken(t || null);

        await fetchDocs(url, dId.deviceId || dId, t || null);
      } catch (err) {
        setError('Failed to initialize: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const fetchDocs = async (url, devId, t = null) => {
    try {
      const headers = { 'X-Device-ID': devId };
      if (t) headers['Authorization'] = `Bearer ${t}`;

      const response = await fetch(`${url}/api/documents`, { headers });
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
      const headers = { 'X-Device-ID': deviceId };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${serverUrl}/api/documents`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Upload failed');
      }

      setFile(null);
      setLabel('');
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';

      await fetchDocs(serverUrl, deviceId, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const headers = { 'X-Device-ID': deviceId };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${serverUrl}/api/documents/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) throw new Error('Failed to delete document');
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetDefault = async (doc) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${serverUrl}/api/documents/${doc._id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isDefault: true, category: doc.category })
      });
      if (!response.ok) throw new Error('Failed to update default');
      await fetchDocs(serverUrl, deviceId, token);
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
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">Manage Documents</h2>
        <p className="text-muted-foreground">Upload resumes, cover letters, and identification cards to fill file attachment fields.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-muted-foreground" /> Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>File</Label>
                <Input
                  id="doc-file-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="cursor-pointer"
                />
                <p className="text-[10px] text-muted-foreground">Accepted: PDF, DOC, DOCX, JPG, PNG. Max 10MB.</p>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Label / Name</Label>
                <Input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Yash Resume 2026"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 pb-2">
                <input
                  type="checkbox"
                  id="is-default"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary"
                />
                <Label htmlFor="is-default" className="text-xs text-muted-foreground cursor-pointer font-normal">
                  Set as default for this category
                </Label>
              </div>

              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  'Upload Document'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" /> Uploaded Documents ({documents.length})
          </h3>

          {documents.length === 0 ? (
            <Card className="text-center py-12 border-dashed">
              <CardContent>
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm font-medium">No documents uploaded yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Upload files on the left to start auto-filling file inputs.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => {
                const catInfo = DOCUMENT_CATEGORIES.find(c => c.value === doc.category) || { label: doc.category, icon: '📎' };
                const sizeKb = Math.round(doc.sizeBytes / 102.4) / 10;
                
                return (
                  <Card key={doc._id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <span className="text-2xl mt-1 p-2 bg-muted rounded-lg">{catInfo.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-card-foreground truncate">{doc.label}</h4>
                            {doc.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{doc.originalName}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {sizeKb} KB • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!doc.isDefault && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetDefault(doc)}
                            className="text-xs h-8"
                          >
                            Make Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="text-xs h-8"
                        >
                          <a
                            href={`${serverUrl}/api/documents/${doc._id}/download?${token ? `token=${token}` : `deviceId=${deviceId}`}`}
                            download
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(doc._id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
