import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../shared/api.js';
import { PROFILE_SECTIONS } from '../../shared/constants.js';

export default function ProfilePage() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFields, setSavedFields] = useState(new Set());
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState('Personal Information');
  const [showSensitive, setShowSensitive] = useState({});
  const [newCustomField, setNewCustomField] = useState({ key: '', value: '', type: 'text', sensitive: false, category: 'Custom', customCategoryName: '' });

  useEffect(() => {
    getProfile()
      .then(res => setProfile(res.profile || {}))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayFieldChange = (arrayKey, index, fieldKey, value) => {
    setProfile(prev => {
      const array = [...(prev[arrayKey] || [])];
      array[index] = { ...array[index], [fieldKey]: value };
      return { ...prev, [arrayKey]: array };
    });
  };

  const handleAddArrayItem = (arrayKey) => {
    setProfile(prev => {
      const array = [...(prev[arrayKey] || [])];
      array.push({});
      return { ...prev, [arrayKey]: array };
    });
  };

  const handleRemoveArrayItem = (arrayKey, index) => {
    setProfile(prev => {
      const array = [...(prev[arrayKey] || [])];
      array.splice(index, 1);
      return { ...prev, [arrayKey]: array };
    });
  };

  const handleCustomFieldChange = (key, updates) => {
    setProfile(prev => {
      const current = prev.customFields?.[key];
      const currentObj = typeof current === 'object' ? current : { value: current || '', type: 'text', sensitive: false, category: 'Custom' };
      return {
        ...prev,
        customFields: {
          ...(prev.customFields || {}),
          [key]: { ...currentObj, ...updates }
        }
      };
    });
  };

  const handleDeleteCustomField = (key) => {
    setProfile(prev => {
      const newCustomFields = { ...prev.customFields };
      delete newCustomFields[key];
      return { ...prev, customFields: newCustomFields };
    });
  };

  const handleAddCustomField = () => {
    if (!newCustomField.key.trim()) {
      setError('Custom field key is required');
      return;
    }
    const key = newCustomField.key.toLowerCase().trim().replace(/[\s\W]+/g, '_');
    handleCustomFieldChange(key, {
      value: newCustomField.value,
      type: newCustomField.type,
      sensitive: newCustomField.sensitive,
      category: newCustomField.category === 'Custom' ? (newCustomField.customCategoryName?.trim() || 'Custom') : newCustomField.category
    });
    setNewCustomField({ key: '', value: '', type: 'text', sensitive: false, category: 'Custom', customCategoryName: '' });
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await updateProfile(profile);
      setProfile(res.profile || profile);
      // Briefly highlight saved
      const saved = new Set(Object.keys(res.profile || profile));
      if ((res.profile || profile).customFields) {
        Object.keys((res.profile || profile).customFields).forEach(k => saved.add(`customFields.${k}`));
      }
      setSavedFields(saved);
      setTimeout(() => setSavedFields(new Set()), 2000);
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

  const uniqueCategories = Array.from(new Set(
    Object.values(profile.customFields || {})
      .map(cf => typeof cf === 'object' ? cf.category : null)
      .filter(c => c && c !== 'Custom' && !PROFILE_SECTIONS.some(s => s.title === c))
  ));

  const renderCustomField = (key) => {
    const isSaved = savedFields.has(`customFields.${key}`);
    const displayLabel = key.replace(/_/g, ' ');
    const cf = profile.customFields[key];
    const fieldObj = typeof cf === 'object' ? cf : { value: cf || '', type: 'text', sensitive: false, category: 'Custom' };
    const showValue = showSensitive[`custom_${key}`];

    return (
      <div key={key} className="relative group border border-surface-border rounded-lg p-3 bg-surface-elevated/50">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 capitalize flex items-center gap-1">
            <span>✨</span> {displayLabel}
          </label>
          <div className="flex items-center gap-2">
            {isSaved && <span className="text-emerald-400 text-[10px]">✓ Saved</span>}
            {fieldObj.sensitive && (
              <button
                onClick={() => setShowSensitive(s => ({ ...s, [`custom_${key}`]: !s[`custom_${key}`] }))}
                className="text-slate-500 hover:text-slate-300 text-[10px]"
              >
                {showValue ? '🙈 Hide' : '👁️ Show'}
              </button>
            )}
            <button
              onClick={() => handleDeleteCustomField(key)}
              className="text-red-400/70 hover:text-red-400 text-[10px]"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
        <input
          type={fieldObj.sensitive && !showValue ? 'password' : fieldObj.type || 'text'}
          className={`input text-sm ${isSaved ? 'border-emerald-500/40' : ''}`}
          value={fieldObj.value}
          onChange={e => handleCustomFieldChange(key, { value: e.target.value })}
          placeholder={`Enter ${displayLabel}`}
        />
        <div className="flex items-center justify-between mt-2 gap-2">
          <select
            className="bg-transparent text-xs text-slate-400 outline-none w-1/3 min-w-[80px]"
            value={fieldObj.category || 'Custom'}
            onChange={e => handleCustomFieldChange(key, { category: e.target.value })}
          >
            <option value="Custom">Custom</option>
            {PROFILE_SECTIONS.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="bg-transparent text-xs text-slate-400 outline-none min-w-[60px]"
            value={fieldObj.type || 'text'}
            onChange={e => handleCustomFieldChange(key, { type: e.target.value })}
          >
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="tel">Phone</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
          <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={!!fieldObj.sensitive}
              onChange={e => handleCustomFieldChange(key, { sensitive: e.target.checked })}
              className="rounded bg-surface border-surface-border text-primary-600 focus:ring-primary-500 h-3 w-3"
            />
            Encrypted
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Your Profile</h2>
        <p className="text-sm text-slate-500">This data is used to fill forms automatically. Sensitive fields are encrypted at rest.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {PROFILE_SECTIONS.map(section => (
          <div key={section.title} className="card overflow-hidden">
            {/* Section header */}
            <button
              className="w-full flex items-center justify-between py-1 text-left"
              onClick={() => setExpandedSection(s => s === section.title ? null : section.title)}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{section.icon}</span>
                <span className="font-semibold text-slate-200 text-sm">{section.title}</span>
                {section.sensitive && (
                  <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs">🔒 Encrypted</span>
                )}
              </div>
              <span className="text-slate-500 text-xs">{expandedSection === section.title ? '▲' : '▼'}</span>
            </button>

            {expandedSection === section.title && !section.isArray && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.fields.map(fieldDef => {
                  const isSaved = savedFields.has(fieldDef.key);
                  const isSensitive = fieldDef.sensitive;
                  const showValue = showSensitive[fieldDef.key];

                  return (
                    <div key={fieldDef.key} className={`${fieldDef.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                      <label className={`label flex items-center justify-between`}>
                        <span>{fieldDef.label}</span>
                        <span className="flex items-center gap-1">
                          {isSaved && <span className="text-emerald-400 text-xs">✓ Saved</span>}
                          {isSensitive && (
                            <button
                              onClick={() => setShowSensitive(s => ({ ...s, [fieldDef.key]: !s[fieldDef.key] }))}
                              className="text-slate-500 hover:text-slate-300 text-xs"
                            >
                              {showValue ? '🙈 Hide' : '👁️ Show'}
                            </button>
                          )}
                        </span>
                      </label>

                      {fieldDef.type === 'textarea' ? (
                        <textarea
                          className="input resize-none"
                          rows={3}
                          value={profile[fieldDef.key] || ''}
                          onChange={e => handleFieldChange(fieldDef.key, e.target.value)}
                          placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
                        />
                      ) : fieldDef.type === 'select' ? (
                        <select
                          className="input"
                          value={profile[fieldDef.key] || ''}
                          onChange={e => handleFieldChange(fieldDef.key, e.target.value)}
                        >
                          <option value="">Select...</option>
                          {fieldDef.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={isSensitive && !showValue ? 'password' : fieldDef.type}
                          className={`input ${isSaved ? 'border-emerald-500/40' : ''}`}
                          value={profile[fieldDef.key] || ''}
                          onChange={e => handleFieldChange(fieldDef.key, e.target.value)}
                          placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
                          autoComplete={isSensitive ? 'off' : 'on'}
                        />
                      )}
                    </div>
                  );
                })}

                {profile.customFields && Object.keys(profile.customFields).filter(key => {
                  const cf = profile.customFields[key];
                  const fieldObj = typeof cf === 'object' ? cf : { category: 'Custom' };
                  return fieldObj.category === section.title;
                }).map(key => renderCustomField(key))}
              </div>
            )}

            {expandedSection === section.title && section.isArray && (
              <div className="mt-4 space-y-4">
                {(profile[section.arrayKey] || []).map((item, index) => (
                  <div key={index} className="relative group border border-surface-border rounded-lg p-4 bg-surface-elevated/30">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRemoveArrayItem(section.arrayKey, index)} className="text-red-400 hover:bg-red-500/10 p-1 rounded">
                        🗑️ Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {section.fields.map(fieldDef => (
                        <div key={fieldDef.key} className={`${fieldDef.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                          <label className="label">{fieldDef.label}</label>
                          {fieldDef.type === 'textarea' ? (
                            <textarea
                              className="input resize-none"
                              rows={3}
                              value={item[fieldDef.key] || ''}
                              onChange={e => handleArrayFieldChange(section.arrayKey, index, fieldDef.key, e.target.value)}
                              placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
                            />
                          ) : fieldDef.type === 'select' ? (
                            <select
                              className="input"
                              value={item[fieldDef.key] || ''}
                              onChange={e => handleArrayFieldChange(section.arrayKey, index, fieldDef.key, e.target.value)}
                            >
                              <option value="">Select...</option>
                              {fieldDef.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={fieldDef.type}
                              className="input"
                              value={item[fieldDef.key] || ''}
                              onChange={e => handleArrayFieldChange(section.arrayKey, index, fieldDef.key, e.target.value)}
                              placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => handleAddArrayItem(section.arrayKey)}
                  className="w-full py-2 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors"
                >
                  ➕ Add New {section.title.split(' ')[0]}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Dynamic Custom Categories */}
        {uniqueCategories.map(cat => (
          <div key={cat} className="card overflow-hidden">
            <button
              className="w-full flex items-center justify-between py-1 text-left"
              onClick={() => setExpandedSection(s => s === cat ? null : cat)}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <span className="font-semibold text-slate-200 text-sm">{cat}</span>
                <span className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 text-xs">Custom</span>
              </div>
              <span className="text-slate-500 text-xs">{expandedSection === cat ? '▲' : '▼'}</span>
            </button>
            
            {expandedSection === cat && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(profile.customFields).filter(key => {
                  const cf = profile.customFields[key];
                  const fieldObj = typeof cf === 'object' ? cf : { category: 'Custom' };
                  return fieldObj.category === cat;
                }).map(key => renderCustomField(key))}
              </div>
            )}
          </div>
        ))}

        {/* Custom Fields Section */}
        <div key="Custom Fields" className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between py-1 text-left"
            onClick={() => setExpandedSection(s => s === 'Custom Fields' ? null : 'Custom Fields')}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <span className="font-semibold text-slate-200 text-sm">Custom Fields</span>
              <span className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 text-xs">Auto-Captured & Manual</span>
            </div>
            <span className="text-slate-500 text-xs">{expandedSection === 'Custom Fields' ? '▲' : '▼'}</span>
          </button>

          {expandedSection === 'Custom Fields' && (
            <div className="mt-4 space-y-4">
              {/* Existing Custom Fields (Not in standard sections) */}
              {profile.customFields && Object.keys(profile.customFields).filter(key => {
                const cf = profile.customFields[key];
                const cat = (typeof cf === 'object' ? cf.category : 'Custom') || 'Custom';
                return !PROFILE_SECTIONS.some(s => s.title === cat);
              }).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(profile.customFields).filter(key => {
                    const cf = profile.customFields[key];
                    const cat = (typeof cf === 'object' ? cf.category : 'Custom') || 'Custom';
                    return !PROFILE_SECTIONS.some(s => s.title === cat) && !uniqueCategories.includes(cat);
                  }).map(key => renderCustomField(key))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No custom fields yet.</p>
              )}

              <div className="mt-4 pt-4 border-t border-surface-border">
                <h4 className="text-sm font-semibold text-slate-300 mb-4">➕ Add New Field</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Field Name</label>
                    <input
                      type="text"
                      className="input py-2 text-sm"
                      placeholder="e.g. Employee ID"
                      value={newCustomField.key}
                      onChange={e => setNewCustomField(prev => ({ ...prev, key: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Value</label>
                    <input
                      type={newCustomField.sensitive ? 'password' : newCustomField.type}
                      className="input py-2 text-sm"
                      placeholder="Value"
                      value={newCustomField.value}
                      onChange={e => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Category</label>
                    <div className="flex flex-col gap-2">
                      <select
                        className="input py-2 text-sm"
                        value={newCustomField.category}
                        onChange={e => setNewCustomField(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="Custom">Custom</option>
                        {PROFILE_SECTIONS.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {newCustomField.category === 'Custom' && (
                        <input
                          type="text"
                          className="input py-2 text-sm"
                          placeholder="Category Name"
                          value={newCustomField.customCategoryName}
                          onChange={e => setNewCustomField(prev => ({ ...prev, customCategoryName: e.target.value }))}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Type</label>
                    <select
                      className="input py-2 text-sm"
                      value={newCustomField.type}
                      onChange={e => setNewCustomField(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                  <div className="flex items-center h-full pt-4 lg:pt-0">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCustomField.sensitive}
                        onChange={e => setNewCustomField(prev => ({ ...prev, sensitive: e.target.checked }))}
                        className="rounded bg-surface border-surface-border text-primary-600 focus:ring-primary-500 h-4 w-4"
                      />
                      Encrypted
                    </label>
                  </div>
                  <div className="flex items-center h-full sm:col-span-2 lg:col-span-1 pt-2 lg:pt-0">
                    <button onClick={handleAddCustomField} className="btn-secondary w-full py-2">
                      Add Field
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            '💾 Save Profile'
          )}
        </button>
      </div>
    </div>
  );
}
