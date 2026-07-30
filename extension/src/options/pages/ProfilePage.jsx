import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../shared/api.js';
import { DEFAULT_SCHEMA_DEFINITIONS } from '../../shared/constants.js';

export default function ProfilePage() {
  const [schemaDefinitions, setSchemaDefinitions] = useState([]);
  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFields, setSavedFields] = useState(new Set());
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState('personal_info');
  const [showSensitive, setShowSensitive] = useState({});
  
  // State for adding new field to a specific section
  const [addingFieldTo, setAddingFieldTo] = useState(null);
  const [newField, setNewField] = useState({ label: '', type: 'text', sensitive: false });

  // State for adding a new section
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSection, setNewSection] = useState({ title: '', isArray: false, icon: '✨' });

  useEffect(() => {
    getProfile()
      .then(res => {
        let profile = res.profile || {};
        let schemas = profile.schemaDefinitions || [];
        let data = profile.profileData || {};
        
        // Initialization if empty
        if (!schemas || schemas.length === 0) {
          schemas = DEFAULT_SCHEMA_DEFINITIONS;
        }
        
        setSchemaDefinitions(schemas);
        setProfileData(data);
        if (schemas.length > 0 && !expandedSection) {
          setExpandedSection(schemas[0].id);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { schemaDefinitions, profileData };
      const res = await updateProfile(payload);
      
      const newSchemas = res.profile?.schemaDefinitions || schemaDefinitions;
      const newData = res.profile?.profileData || profileData;
      setSchemaDefinitions(newSchemas);
      setProfileData(newData);
      
      // Briefly highlight saved
      setSavedFields(new Set(['all']));
      setTimeout(() => setSavedFields(new Set()), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (sectionId, fieldKey, value) => {
    setProfileData(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldKey]: value
      }
    }));
  };

  const handleArrayFieldChange = (sectionId, index, fieldKey, value) => {
    setProfileData(prev => {
      const sectionArray = [...(prev[sectionId] || [])];
      sectionArray[index] = { ...sectionArray[index], [fieldKey]: value };
      return { ...prev, [sectionId]: sectionArray };
    });
  };

  const handleAddArrayItem = (sectionId) => {
    setProfileData(prev => {
      const sectionArray = [...(prev[sectionId] || [])];
      sectionArray.push({});
      return { ...prev, [sectionId]: sectionArray };
    });
  };

  const handleRemoveArrayItem = (sectionId, index) => {
    setProfileData(prev => {
      const sectionArray = [...(prev[sectionId] || [])];
      sectionArray.splice(index, 1);
      return { ...prev, [sectionId]: sectionArray };
    });
  };

  const handleAddFieldSubmit = (sectionId) => {
    if (!newField.label.trim()) {
       alert("Field label is required");
       return;
    }
    const key = newField.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    setSchemaDefinitions(prev => prev.map(sec => {
      if (sec.id === sectionId) {
         return {
            ...sec,
            fields: [...(sec.fields || []), { key, label: newField.label, type: newField.type, sensitive: newField.sensitive }]
         };
      }
      return sec;
    }));
    
    setAddingFieldTo(null);
    setNewField({ label: '', type: 'text', sensitive: false });
  };

  const handleAddSectionSubmit = () => {
    if (!newSection.title.trim()) {
       alert("Section title is required");
       return;
    }
    const id = newSection.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setSchemaDefinitions(prev => [
      ...prev,
      {
         id,
         title: newSection.title,
         icon: newSection.icon || '✨',
         isArray: newSection.isArray,
         fields: []
      }
    ]);
    setIsAddingSection(false);
    setNewSection({ title: '', isArray: false, icon: '✨' });
    setExpandedSection(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Your Profile</h2>
        <p className="text-sm text-slate-500">This data is used to fill forms automatically. The schema is fully dynamic, so you can add whatever fields you need!</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Dynamic Sections */}
      <div className="space-y-4">
        {schemaDefinitions.map(section => (
          <div key={section.id} className="card overflow-hidden">
            {/* Section header */}
            <button
              className="w-full flex items-center justify-between py-2 text-left"
              onClick={() => setExpandedSection(s => s === section.id ? null : section.id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{section.icon}</span>
                <span className="font-semibold text-slate-200">{section.title}</span>
                {section.isArray && (
                  <span className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 text-xs px-2 py-0.5 rounded">Set/List</span>
                )}
              </div>
              <span className="text-slate-500 text-sm">{expandedSection === section.id ? '▲' : '▼'}</span>
            </button>

            {expandedSection === section.id && !section.isArray && (
              <div className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(section.fields || []).map(fieldDef => {
                    const isSensitive = fieldDef.sensitive;
                    const showValue = showSensitive[`${section.id}_${fieldDef.key}`];
                    const val = profileData[section.id]?.[fieldDef.key] || '';

                    return (
                      <div key={fieldDef.key} className={`${fieldDef.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                        <label className="label flex items-center justify-between">
                          <span>{fieldDef.label} {isSensitive && '🔒'}</span>
                          {isSensitive && (
                            <button
                              onClick={() => setShowSensitive(s => ({ ...s, [`${section.id}_${fieldDef.key}`]: !s[`${section.id}_${fieldDef.key}`] }))}
                              className="text-slate-500 hover:text-slate-300 text-[10px]"
                            >
                              {showValue ? '🙈 Hide' : '👁️ Show'}
                            </button>
                          )}
                        </label>
                        {fieldDef.type === 'textarea' ? (
                          <textarea
                            className="input resize-none"
                            rows={3}
                            value={val}
                            onChange={e => handleFieldChange(section.id, fieldDef.key, e.target.value)}
                          />
                        ) : fieldDef.type === 'select' ? (
                          <select
                            className="input"
                            value={val}
                            onChange={e => handleFieldChange(section.id, fieldDef.key, e.target.value)}
                          >
                            <option value="">Select...</option>
                            {fieldDef.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            type={isSensitive && !showValue ? 'password' : fieldDef.type}
                            className="input"
                            value={val}
                            onChange={e => handleFieldChange(section.id, fieldDef.key, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Add Field to Object Section */}
                <div className="mt-4 pt-4 border-t border-surface-border">
                  {addingFieldTo === section.id ? (
                     <div className="flex flex-col sm:flex-row gap-2 items-end">
                       <div className="flex-1">
                          <label className="label text-xs">Field Label</label>
                          <input type="text" className="input text-sm" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} placeholder="e.g. Hobby" />
                       </div>
                       <div className="w-24">
                          <label className="label text-xs">Type</label>
                          <select className="input text-sm" value={newField.type} onChange={e => setNewField({...newField, type: e.target.value})}>
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                          </select>
                       </div>
                       <div className="flex items-center mb-2 px-2">
                          <label className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer">
                             <input type="checkbox" checked={newField.sensitive} onChange={e => setNewField({...newField, sensitive: e.target.checked})} className="rounded bg-surface border-surface-border h-3 w-3" />
                             Encrypted
                          </label>
                       </div>
                       <button onClick={() => handleAddFieldSubmit(section.id)} className="btn-secondary text-sm h-10 px-4">Add</button>
                       <button onClick={() => setAddingFieldTo(null)} className="btn-secondary text-sm h-10 px-4 text-slate-400">Cancel</button>
                     </div>
                  ) : (
                    <button onClick={() => setAddingFieldTo(section.id)} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium">
                       ➕ Add Custom Field
                    </button>
                  )}
                </div>
              </div>
            )}

            {expandedSection === section.id && section.isArray && (
              <div className="mt-4 space-y-4">
                {(profileData[section.id] || []).map((item, index) => (
                  <div key={index} className="relative group border border-surface-border rounded-lg p-4 bg-surface-elevated/30">
                    <div className="absolute top-2 right-2">
                      <button onClick={() => handleRemoveArrayItem(section.id, index)} className="text-red-400/50 hover:text-red-400 text-xs p-1">
                        🗑️ Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {(section.fields || []).map(fieldDef => {
                         const val = item[fieldDef.key] || '';
                         return (
                          <div key={fieldDef.key} className={`${fieldDef.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                            <label className="label">{fieldDef.label} {fieldDef.sensitive && '🔒'}</label>
                            {fieldDef.type === 'textarea' ? (
                              <textarea className="input resize-none" rows={2} value={val} onChange={e => handleArrayFieldChange(section.id, index, fieldDef.key, e.target.value)} />
                            ) : fieldDef.type === 'select' ? (
                              <select className="input" value={val} onChange={e => handleArrayFieldChange(section.id, index, fieldDef.key, e.target.value)}>
                                <option value="">Select...</option>
                                {fieldDef.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input type={fieldDef.sensitive ? 'password' : fieldDef.type} className="input" value={val} onChange={e => handleArrayFieldChange(section.id, index, fieldDef.key, e.target.value)} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                   <button
                     onClick={() => handleAddArrayItem(section.id)}
                     className="flex-1 py-2 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors text-sm"
                   >
                     ➕ Add New {section.title.split(' ')[0]} Entry
                   </button>
                </div>

                {/* Add Field to Array Section Schema */}
                <div className="mt-4 pt-4 border-t border-surface-border">
                  {addingFieldTo === section.id ? (
                     <div className="flex flex-col sm:flex-row gap-2 items-end">
                       <div className="flex-1">
                          <label className="label text-xs">Field Label</label>
                          <input type="text" className="input text-sm" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} placeholder="e.g. URL" />
                       </div>
                       <div className="w-24">
                          <label className="label text-xs">Type</label>
                          <select className="input text-sm" value={newField.type} onChange={e => setNewField({...newField, type: e.target.value})}>
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                          </select>
                       </div>
                       <button onClick={() => handleAddFieldSubmit(section.id)} className="btn-secondary text-sm h-10 px-4">Add</button>
                       <button onClick={() => setAddingFieldTo(null)} className="btn-secondary text-sm h-10 px-4 text-slate-400">Cancel</button>
                     </div>
                  ) : (
                    <button onClick={() => setAddingFieldTo(section.id)} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium">
                       ➕ Add Custom Field to {section.title} Schema
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>
        ))}

        {/* Add New Section */}
        <div className="card overflow-hidden bg-surface-elevated/20 border-dashed">
           {isAddingSection ? (
              <div className="p-4 space-y-4">
                 <h4 className="text-sm font-semibold text-slate-300">Create New Category</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <label className="label">Category Name</label>
                       <input type="text" className="input" value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="e.g. Social Media Links" />
                    </div>
                    <div>
                       <label className="label">Category Type</label>
                       <select className="input" value={newSection.isArray ? 'array' : 'object'} onChange={e => setNewSection({...newSection, isArray: e.target.value === 'array'})}>
                         <option value="object">Single Object (e.g. Personal Info)</option>
                         <option value="array">List/Set (e.g. Work Experience)</option>
                       </select>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={handleAddSectionSubmit} className="btn-primary flex-1">Create Category</button>
                    <button onClick={() => setIsAddingSection(false)} className="btn-secondary">Cancel</button>
                 </div>
              </div>
           ) : (
             <button onClick={() => setIsAddingSection(true)} className="w-full py-3 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-2 font-medium">
               ➕ Add New Category
             </button>
           )}
        </div>

      </div>

      {/* Save button fixed to bottom */}
      <div className="fixed bottom-0 left-56 right-0 p-4 bg-surface/80 backdrop-blur-md border-t border-surface-border flex justify-end z-10">
        <div className="max-w-2xl w-full mx-auto flex justify-end items-center gap-4">
          {savedFields.has('all') && <span className="text-emerald-400 text-sm animate-pulse">✓ Saved Successfully</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-2 shadow-glow">
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
    </div>
  );
}
