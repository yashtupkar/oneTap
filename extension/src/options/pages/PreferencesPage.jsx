import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../shared/api.js';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, ShieldCheck, Cpu, Save } from "lucide-react";

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">Preferences</h2>
        <p className="text-muted-foreground">Configure autofill behavior, AI provider settings, and security controls.</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm font-medium">
          ✓ Preferences saved successfully!
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-muted-foreground" /> General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Autofill</Label>
                <p className="text-sm text-muted-foreground">Turn autofill overlay badges and auto-filling on or off globally.</p>
              </div>
              <Switch checked={settings.enabled} onCheckedChange={(v) => handleChange('enabled', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Show Visual Overlays</Label>
                <p className="text-sm text-muted-foreground">Display the small status/confidence badge beside form fields.</p>
              </div>
              <Switch checked={settings.showOverlays} onCheckedChange={(v) => handleChange('showOverlays', v)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-muted-foreground" /> Security & Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Confirm sensitive fields</Label>
                <p className="text-sm text-muted-foreground">Always ask for confirmation before filling sensitive identity fields.</p>
              </div>
              <Switch checked={settings.askBeforeSensitiveFields} onCheckedChange={(v) => handleChange('askBeforeSensitiveFields', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Confirm file attachments</Label>
                <p className="text-sm text-muted-foreground">Always prompt before filling file input selectors with saved documents.</p>
              </div>
              <Switch checked={settings.askBeforeFileUpload} onCheckedChange={(v) => handleChange('askBeforeFileUpload', v)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-muted-foreground" /> AI Engine Setup
            </CardTitle>
            <CardDescription>Configure connection to the OpenRouter integration or local AI provider.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>OpenRouter API Key (Optional)</Label>
              <Input
                type="password"
                value={settings.openrouterApiKey || ''}
                onChange={e => handleChange('openrouterApiKey', e.target.value)}
                placeholder="sk-or-v1-..."
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                If not provided, the extension will fall back to the server-configured API key for semantic matching.
              </p>
            </div>

           
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="sticky bottom-0 left-0 right-0 p-3 bg-background/90 backdrop-blur-md border-t border-border flex justify-end z-10 mt-8 rounded-t-xl -mx-6 -mb-6 px-6 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
          <Button type="submit" disabled={saving} className="shadow-sm shadow-primary/20 min-w-[140px]">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Preferences</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
