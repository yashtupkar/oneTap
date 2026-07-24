import React, { useState, useEffect, useRef } from 'react';
import { recordCorrection } from '../shared/api.js';

import { saveSubmission } from '../shared/api.js';
import { collectFieldValues } from './SubmissionCapture.js';

const STATUS_CONFIG = {
  filled: { emoji: '✅', label: 'Filled', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: '#10b981' },
  suggested: { emoji: '✨', label: 'Suggested', color: '#818cf8', bg: 'rgba(99,102,241,0.15)', border: '#818cf8' },
  missing: { emoji: '❌', label: 'Missing', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: '#ef4444' },
  save: { emoji: '💾', label: 'Save Field', color: '#a0a8c0', bg: 'rgba(160,168,192,0.15)', border: '#a0a8c0' },
};

/**
 * FieldOverlay — An inline Grammarly-style button rendered inside a form field.
 *
 * @param {object} props
 * @param {object} props.suggestion - The autofill suggestion from the API
 * @param {import('./FormDetector.js').FormField} props.field - The form field descriptor
 * @param {DOMRect} props.rect - Bounding rect of the field element
 * @param {function} props.onEdit - Called when user edits/corrects the value
 * @param {function} props.onApply - Called to apply the suggestion
 */
export function FieldOverlay({ suggestion, field, rect, onEdit, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const [editValue, setEditValue] = useState(suggestion?.value || '');
  const [isEditing, setIsEditing] = useState(false);
  const overlayRef = useRef(null);

  // Default to suggested if it has a value, but index.jsx will pass status down. 
  // Wait, index.jsx currently sets status in `suggestions` object?
  // Let's rely on suggestion.status
  const [localStatus, setLocalStatus] = useState(suggestion?.status || 'missing');
  const [hasValue, setHasValue] = useState(!!(field?.element?.value));

  useEffect(() => {
    setEditValue(suggestion?.value || '');
    setLocalStatus(suggestion?.status || 'missing');
  }, [suggestion]);

  useEffect(() => {
    if (!field || !field.element) return;

    const handleInput = () => setHasValue(!!field.element.value.trim());
    field.element.addEventListener('input', handleInput);

    return () => {
      field.element.removeEventListener('input', handleInput);
    };
  }, [field]);

  // Close expanded on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        setExpanded(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [expanded]);

  const handleEditSubmit = async () => {
    if (editValue !== suggestion?.value) {
      await recordCorrection(
        { name: field.name, id: field.id, label: field.label, placeholder: field.placeholder, type: field.type },
        suggestion?.profileKey,
        suggestion?.profileKey, 
        window.location.hostname
      );
      onEdit?.(editValue);
      setLocalStatus('filled');
    }
    setIsEditing(false);
    setExpanded(false);
  };

  const handleApplyClick = async (e) => {
    e.preventDefault();
    const canApply = suggestion?.value || suggestion?.isFileInput;
    if (canApply && (localStatus === 'suggested' || localStatus === 'filled')) {
      onApply?.();
      setLocalStatus('filled');
    } else if (localStatus === 'missing' && hasValue) {
      // Save this specific field
      const val = collectFieldValues([field]);
      if (val.length > 0) {
        try {
          await saveSubmission(window.location.href, window.location.hostname, val);
          setLocalStatus('filled');
        } catch (err) {
          console.error('[AI Autofill] Failed to save field', err);
        }
      }
    }
  };

  const isSaveMode = localStatus === 'missing' && hasValue;
  const configKey = isSaveMode ? 'save' : localStatus;
  const config = STATUS_CONFIG[configKey] || STATUS_CONFIG.missing;
  const confidence = suggestion?.confidence ? Math.round(suggestion.confidence * 100) : 0;

  // Don't render anything if there's no suggestion and the field is empty
  if (localStatus === 'missing' && !hasValue) {
    return null; 
  }

  const top = rect ? rect.top + window.scrollY : 0;
  // Position inside the right edge of the input
  const left = rect ? rect.right + window.scrollX - 28 : 0;

  const displayValue = suggestion?.isSensitive 
    ? suggestion.value?.slice(0, 2) + '••••' + suggestion.value?.slice(-2)
    : suggestion?.value;

  return (
    <div
      ref={overlayRef}
      className="ai-af-inline-btn"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: 'absolute',
        top: `${top + (rect ? rect.height / 2 : 0) - 12}px`,
        left: `${left}px`,
        zIndex: 2147483640,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '11px',
        lineHeight: 1.2,
      }}
    >
      {/* Status icon button */}
      <div
        onClick={handleApplyClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: config.bg,
          border: `1px solid ${config.border}`,
          color: config.color,
          cursor: 'pointer',
          userSelect: 'none',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'all 0.15s ease',
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title={`${config.label} ${localStatus !== 'missing' ? `— ${confidence}% confidence.` : ''} Click to ${localStatus === 'suggested' ? 'auto-fill' : isSaveMode ? 'save' : 'edit'}`}
      >
        <span style={{ fontSize: '13px' }}>{config.emoji}</span>
      </div>

      {/* Expanded popover */}
      {expanded && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '240px',
            background: '#1a1d27',
            border: '1px solid #2e3248',
            borderRadius: '10px',
            padding: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 2147483641,
            animation: 'ai-af-slide-up 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#a0a8c0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AI Autofill
            </span>
            <span style={{ color: config.color, fontSize: '10px', fontWeight: 600 }}>
              {config.label}
            </span>
          </div>

          {/* Confidence bar */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#6b7280', fontSize: '10px' }}>Confidence</span>
              <span style={{ color: config.color, fontSize: '10px', fontWeight: 600 }}>{confidence}%</span>
            </div>
            <div style={{ height: '3px', background: '#2e3248', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidence}%`, background: config.color, borderRadius: '2px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Profile key */}
          {suggestion?.profileKey && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#6b7280', fontSize: '10px' }}>Field: </span>
              <span style={{ color: '#a5bbfc', fontSize: '10px', fontFamily: 'monospace' }}>{suggestion.profileKey}</span>
            </div>
          )}

          {/* Reason */}
          <div style={{ marginBottom: '8px', color: '#9ca3af', fontSize: '10px', lineHeight: 1.4 }}>
            {suggestion?.reason || 'No match found'}
          </div>

          {/* Value / Edit */}
          {suggestion?.value && !suggestion.isFileInput && (
            <div style={{ marginBottom: '8px' }}>
              {isEditing ? (
                <div>
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    style={{
                      width: '100%', padding: '5px 8px', borderRadius: '6px',
                      border: '1px solid #4e52e8', background: '#0f1117',
                      color: '#e2e8f0', fontSize: '11px', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <button onClick={handleEditSubmit} style={btnStyle('#4e52e8')}>Apply</button>
                    <button onClick={() => setIsEditing(false)} style={btnStyle('#2e3248')}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#e2e8f0', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px', whiteSpace: 'nowrap' }}>
                    {displayValue}
                  </span>
                  <button onClick={() => setIsEditing(true)} style={btnStyle('#2e3248', '9px')}>✏️ Edit</button>
                </div>
              )}
            </div>
          )}

          {/* File Input Document Details */}
          {suggestion?.isFileInput && suggestion?.document && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e2e8f0', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', whiteSpace: 'nowrap' }}>
                  📄 {suggestion.document.originalName}
                </span>
              </div>
            </div>
          )}

          {/* Apply button inside popover */}
          {(suggestion?.value || suggestion?.isFileInput) && !isEditing && localStatus !== 'filled' && (
            <button
              onClick={(e) => { handleApplyClick(e); }}
              style={{
                ...btnStyle('#4e52e8'),
                width: '100%',
                justifyContent: 'center',
                padding: '6px',
              }}
            >
              ⚡ {suggestion?.isFileInput ? 'Attach Document' : 'Fill This Field'}
            </button>
          )}

        </div>
      )}
    </div>
  );
}

const btnStyle = (bg, fontSize = '10px') => ({
  padding: '4px 8px',
  borderRadius: '5px',
  background: bg,
  color: '#e2e8f0',
  border: 'none',
  cursor: 'pointer',
  fontSize,
  fontFamily: "'Inter', system-ui, sans-serif",
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  fontWeight: 500,
});
