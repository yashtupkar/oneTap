import React, { useState } from 'react';
import { saveSubmission } from '../shared/api.js';
import { showToast } from './Toast.js';

export function SaveFieldsModal({ fields, onComplete, onCancel }) {
  const [fieldData, setFieldData] = useState(
    fields.map(f => ({
      ...f,
      customName: f.label || f.name || f.id || '',
      isSensitive: false
    }))
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const handleNameChange = (index, newName) => {
    const updated = [...fieldData];
    updated[index].customName = newName;
    setFieldData(updated);
  };

  const handleSensitiveChange = (index, sensitive) => {
    const updated = [...fieldData];
    updated[index].isSensitive = sensitive;
    setFieldData(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      showToast('💾 OneTap: Saving new fields...', 'save', 2000);
      await saveSubmission(window.location.href, window.location.hostname, fieldData);
      showToast('✅ Saved successfully!', 'success');
      onComplete();
    } catch (err) {
      console.error('[AI Autofill] Failed to save all new fields', err);
      showToast('❌ Failed to save fields', 'error');
    }
    setIsSaving(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '80px',
        width: '320px',
        maxHeight: '400px',
        background: '#1a1d27',
        border: '1px solid #2e3248',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 2147483645,
        fontFamily: "'Inter', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        animation: 'ai-af-slide-up 0.2s ease-out'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#e2e8f0', fontWeight: 600 }}>Save New Fields</h3>
        <button 
          onClick={onCancel}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}
        >×</button>
      </div>
      
      <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#9ca3af', lineHeight: 1.4 }}>
        You are saving {fields.length} new field{fields.length > 1 ? 's' : ''}. Please provide a name for each field to easily identify it later.
      </p>

      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fieldData.map((fd, idx) => (
          <div key={idx} style={{ background: '#0f1117', padding: '10px', borderRadius: '8px', border: '1px solid #2e3248' }}>
            <div style={{ fontSize: '11px', color: '#a5bbfc', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Value: {fd.value && !fd.isSensitive ? fd.value.substring(0, 30) : '••••••••'}
            </div>
            
            <input
              type="text"
              value={fd.customName}
              onChange={(e) => handleNameChange(idx, e.target.value)}
              placeholder="Field Name (e.g. Secret Code)"
              style={{
                width: '100%', padding: '6px 10px', borderRadius: '6px',
                border: '1px solid #4e52e8', background: '#1a1d27',
                color: '#e2e8f0', fontSize: '12px', outline: 'none',
                boxSizing: 'border-box', marginBottom: '8px'
              }}
            />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#a0a8c0', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={fd.isSensitive} 
                onChange={(e) => handleSensitiveChange(idx, e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Encrypt this field
            </label>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          style={{ 
            flex: 1, padding: '8px', borderRadius: '8px', background: '#4e52e8', color: 'white', 
            border: 'none', cursor: isSaving ? 'wait' : 'pointer', fontWeight: 500, fontSize: '12px' 
          }}
        >
          {isSaving ? 'Saving...' : 'Confirm Save'}
        </button>
        <button 
          onClick={onCancel}
          disabled={isSaving}
          style={{ 
            flex: 1, padding: '8px', borderRadius: '8px', background: '#2e3248', color: 'white', 
            border: 'none', cursor: isSaving ? 'wait' : 'pointer', fontWeight: 500, fontSize: '12px' 
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
