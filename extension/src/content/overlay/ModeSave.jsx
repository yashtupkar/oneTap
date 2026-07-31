import React, { useState } from 'react';
import { Save } from 'lucide-react';

export function ModeSave({ onSave, onCancel, defaultName }) {
  const [step, setStep] = useState(1);
  const [customName, setCustomName] = useState(defaultName || '');
  const [isSensitive, setIsSensitive] = useState(false);

  if (step === 1) {
    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '13px', color: '#F9FAFB', fontWeight: 500 }}>
          Current value detected.
        </div>
        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
          Save this to your profile?
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={() => setStep(2)}
            style={{
              flex: 1,
              height: '36px',
              background: '#3B82F6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 150ms ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563EB'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3B82F6'}
          >
            Save
          </button>
          
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: '36px',
              background: 'transparent',
              color: '#9CA3AF',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#374151';
              e.currentTarget.style.color = '#F9FAFB';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#9CA3AF';
            }}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
        Name this field to save it:
      </div>
      
      <input
        type="text"
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        placeholder="e.g. Secret Code"
        autoFocus
        style={{
          width: '100%',
          height: '40px',
          padding: '0 12px',
          background: '#111827',
          border: '1px solid #374151',
          borderRadius: '8px',
          color: '#F9FAFB',
          fontSize: '13px',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
        onBlur={(e) => e.target.style.borderColor = '#374151'}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(customName, isSensitive);
          if (e.key === 'Escape') onCancel();
        }}
      />
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#D1D5DB', cursor: 'pointer', marginTop: '4px' }}>
        <input
          type="checkbox"
          checked={isSensitive}
          onChange={(e) => setIsSensitive(e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: '#3B82F6', cursor: 'pointer' }}
        />
        Encrypt this field
      </label>
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={() => onSave(customName, isSensitive)}
          style={{
            flex: 1,
            height: '36px',
            background: '#22C55E',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 150ms ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#16A34A'}
          onMouseOut={(e) => e.currentTarget.style.background = '#22C55E'}
        >
          Confirm Save
        </button>
        
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            height: '36px',
            background: 'transparent',
            color: '#9CA3AF',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#374151';
            e.currentTarget.style.color = '#F9FAFB';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9CA3AF';
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
