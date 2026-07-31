import React, { useState, useEffect, useRef } from 'react';
import { recordCorrection, saveSubmission } from '../shared/api.js';
import { collectFieldValues } from './SubmissionCapture.js';

import { useFloatingPosition } from './overlay/useFloatingPosition.js';
import { FieldChip } from './overlay/FieldChip.jsx';
import { ModeSuggestion } from './overlay/ModeSuggestion.jsx';
import { ModeMultipleSuggestions } from './overlay/ModeMultipleSuggestions.jsx';
import { ModeSave } from './overlay/ModeSave.jsx';
import { ModeBrowseProfile } from './overlay/ModeBrowseProfile.jsx';
import './overlay/OverlayAnimations.css';

/**
 * FieldOverlay — Premium, minimal, native-feeling inline autofill control.
 */
export function FieldOverlay({ suggestion, field, rect, flattenedProfileData = [], onEdit, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const [explicitBrowse, setExplicitBrowse] = useState(false);
  const overlayRef = useRef(null);
  const isHovered = useRef(false);

  const [localStatus, setLocalStatus] = useState(suggestion?.status || 'missing');
  const [hasValue, setHasValue] = useState(!!(field?.element?.value));

  // Update status when new props arrive
  useEffect(() => {
    setLocalStatus(suggestion?.status || 'missing');
  }, [suggestion]);

  // Bind to field events
  useEffect(() => {
    if (!field || !field.element) return;

    const handleInput = () => setHasValue(!!field.element.value.trim());

    const handleFocus = () => {
      setExpanded(true);
      setExplicitBrowse(false);
    };
    
    const handleBlur = () => {
      if (isHovered.current) return;
      setExpanded(false);
      setExplicitBrowse(false);
    };

    field.element.addEventListener('input', handleInput);
    field.element.addEventListener('focus', handleFocus);
    field.element.addEventListener('blur', handleBlur);

    if (document.activeElement === field.element) {
      setExpanded(true);
    }

    return () => {
      field.element.removeEventListener('input', handleInput);
      field.element.removeEventListener('focus', handleFocus);
      field.element.removeEventListener('blur', handleBlur);
    };
  }, [field]);

  // Close expanded on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        setExpanded(false);
        setExplicitBrowse(false);
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [expanded]);

  // Actions
  const handleApplyClick = async (e) => {
    e.preventDefault();
    if (suggestion?.options && localStatus !== 'filled') {
      setExpanded(true);
      return;
    }
    const canApply = suggestion?.value || suggestion?.isFileInput;
    if (canApply && (localStatus === 'suggested' || localStatus === 'filled')) {
      onApply?.();
      setLocalStatus('filled');
      setExpanded(false);
    } else if (localStatus === 'missing' && hasValue) {
      setExpanded(true);
      setExplicitBrowse(false);
    } else if (localStatus === 'missing' && !hasValue) {
      setExpanded(true);
      setExplicitBrowse(true);
    }
  };

  const handleSelectOption = (optValue) => {
    onEdit?.(optValue);
    setLocalStatus('filled');
    setExpanded(false);
  };

  const handleSaveField = async (customName, isSensitive) => {
    const val = collectFieldValues([field]);
    if (val.length > 0) {
      try {
        const fieldData = { ...val[0], customName, isSensitive };
        await saveSubmission(window.location.href, window.location.hostname, [fieldData]);
        setLocalStatus('filled');
        setExpanded(false);
      } catch (err) {
        console.error('[OneTap] Failed to save field', err);
      }
    }
  };

  const isSaveMode = localStatus === 'missing' && hasValue;
  
  // Do not render if there's nothing to show
  if (localStatus === 'missing' && !hasValue && !expanded) {
    return null; 
  }

  const top = rect ? rect.top + window.scrollY - 28 : 0;
  const left = rect ? rect.right + window.scrollX - 24 : 0;

  // Determine current mode for the popup
  let currentMode = 'SUGGESTION';
  if (explicitBrowse) {
    currentMode = 'BROWSE';
  } else if (isSaveMode) {
    currentMode = 'SAVE';
  } else if (suggestion?.options) {
    currentMode = 'MULTIPLE';
  } else if (suggestion?.value || suggestion?.isFileInput) {
    currentMode = 'SUGGESTION';
  } else {
    currentMode = 'BROWSE';
  }

  const floatingStyle = useFloatingPosition(rect, expanded, 280, 200);

  return (
    <div className="onetap-overlay-base" ref={overlayRef}>
      {/* Inline Chip */}
      {(localStatus !== 'missing' || hasValue) && (
        <div
          onMouseEnter={() => {
            isHovered.current = true;
            setExpanded(true);
          }}
          onMouseLeave={() => {
            isHovered.current = false;
            if (document.activeElement !== field?.element) {
              setExpanded(false);
              setExplicitBrowse(false);
            }
          }}
          style={{
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: expanded ? 2147483645 : 2147483640,
          }}
        >
          <FieldChip 
            status={isSaveMode ? 'save' : localStatus} 
            expanded={expanded} 
            onClick={handleApplyClick} 
          />
        </div>
      )}

      {/* Floating Popup Portal */}
      {expanded && (
        <div
          onMouseEnter={() => isHovered.current = true}
          onMouseLeave={() => {
            isHovered.current = false;
            if (document.activeElement !== field?.element) {
              setExpanded(false);
              setExplicitBrowse(false);
            }
          }}
          className="onetap-popup-animate"
          style={{
            ...floatingStyle,
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {currentMode === 'SUGGESTION' && (
            <ModeSuggestion 
              suggestion={suggestion} 
              onApply={() => {
                onApply?.();
                setLocalStatus('filled');
                setExpanded(false);
              }}
              onBrowse={() => setExplicitBrowse(true)}
            />
          )}

          {currentMode === 'MULTIPLE' && (
            <ModeMultipleSuggestions 
              options={suggestion.options} 
              onSelect={handleSelectOption} 
            />
          )}

          {currentMode === 'SAVE' && (
            <ModeSave 
              defaultName={field?.label || field?.name || ''} 
              onSave={handleSaveField} 
              onCancel={() => {
                setExpanded(false);
                setExplicitBrowse(false);
              }} 
            />
          )}

          {currentMode === 'BROWSE' && (
            <ModeBrowseProfile 
              flattenedProfileData={flattenedProfileData} 
              onSelect={handleSelectOption} 
            />
          )}
        </div>
      )}
    </div>
  );
}