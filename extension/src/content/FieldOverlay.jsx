// import React, { useState, useEffect, useRef } from 'react';
// import { recordCorrection } from '../shared/api.js';

// import { saveSubmission } from '../shared/api.js';
// import { collectFieldValues } from './SubmissionCapture.js';

// const STATUS_CONFIG = {
//   filled: { emoji: '✅', label: 'Filled', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: '#10b981' },
//   suggested: { emoji: '✨', label: 'Suggested', color: '#818cf8', bg: 'rgba(99,102,241,0.15)', border: '#818cf8' },
//   missing: { emoji: '❌', label: 'Missing', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: '#ef4444' },
//   save: { emoji: '💾', label: 'Save Field', color: '#a0a8c0', bg: 'rgba(160,168,192,0.15)', border: '#a0a8c0' },
// };

// /**
//  * FieldOverlay — An inline Grammarly-style button rendered inside a form field.
//  *
//  * @param {object} props
//  * @param {object} props.suggestion - The autofill suggestion from the API
//  * @param {import('./FormDetector.js').FormField} props.field - The form field descriptor
//  * @param {DOMRect} props.rect - Bounding rect of the field element
//  * @param {function} props.onEdit - Called when user edits/corrects the value
//  * @param {function} props.onApply - Called to apply the suggestion
//  */
// export function FieldOverlay({ suggestion, field, rect, onEdit, onApply }) {
//   const [expanded, setExpanded] = useState(false);
//   const [editValue, setEditValue] = useState(suggestion?.value || '');
//   const [isEditing, setIsEditing] = useState(false);
//   const [showNamePrompt, setShowNamePrompt] = useState(false);
//   const [customName, setCustomName] = useState(field?.label || field?.name || '');
//   const [isSensitive, setIsSensitive] = useState(false);
//   const overlayRef = useRef(null);
//   const isHovered = useRef(false);

//   // Default to suggested if it has a value, but index.jsx will pass status down. 
//   // Wait, index.jsx currently sets status in `suggestions` object?
//   // Let's rely on suggestion.status
//   const [localStatus, setLocalStatus] = useState(suggestion?.status || 'missing');
//   const [hasValue, setHasValue] = useState(!!(field?.element?.value));

//   useEffect(() => {
//     setEditValue(suggestion?.value || '');
//     setLocalStatus(suggestion?.status || 'missing');
//   }, [suggestion]);

//   useEffect(() => {
//     if (!field || !field.element) return;

//     const handleInput = () => setHasValue(!!field.element.value.trim());
    
//     const handleFocus = () => setExpanded(true);
//     const handleBlur = () => {
//       if (isHovered.current) return;
//       setExpanded(false);
//       setIsEditing(false);
//       setShowNamePrompt(false);
//     };

//     field.element.addEventListener('input', handleInput);
//     field.element.addEventListener('focus', handleFocus);
//     field.element.addEventListener('blur', handleBlur);

//     if (document.activeElement === field.element) {
//       setExpanded(true);
//     }

//     return () => {
//       field.element.removeEventListener('input', handleInput);
//       field.element.removeEventListener('focus', handleFocus);
//       field.element.removeEventListener('blur', handleBlur);
//     };
//   }, [field]);

//   // Close expanded on outside click
//   useEffect(() => {
//     if (!expanded) return;
//     const handler = (e) => {
//       if (overlayRef.current && !overlayRef.current.contains(e.target)) {
//         setExpanded(false);
//         setIsEditing(false);
//         setShowNamePrompt(false);
//       }
//     };
//     document.addEventListener('mousedown', handler, true);
//     return () => document.removeEventListener('mousedown', handler, true);
//   }, [expanded]);

//   const handleEditSubmit = async () => {
//     if (editValue !== suggestion?.value) {
//       await recordCorrection(
//         { name: field.name, id: field.id, label: field.label, placeholder: field.placeholder, type: field.type },
//         suggestion?.profileKey,
//         suggestion?.profileKey, 
//         window.location.hostname
//       );
//       onEdit?.(editValue);
//       setLocalStatus('filled');
//     }
//     setIsEditing(false);
//     setExpanded(false);
//   };

//   const handleOptionSelect = (optValue) => {
//     onEdit?.(optValue);
//     setLocalStatus('filled');
//     setExpanded(false);
//   };

//   const handleApplyClick = async (e) => {
//     e.preventDefault();
//     const canApply = suggestion?.value || suggestion?.isFileInput;
//     if (canApply && (localStatus === 'suggested' || localStatus === 'filled')) {
//       onApply?.();
//       setLocalStatus('filled');
//     } else if (localStatus === 'missing' && hasValue) {
//       if (!expanded) {
//         setExpanded(true);
//         return;
//       }
//       setShowNamePrompt(true);
//     }
//   };

//   const handleSaveConfirm = async () => {
//     const val = collectFieldValues([field]);
//     if (val.length > 0) {
//       try {
//         const fieldData = { ...val[0], customName, isSensitive };
//         await saveSubmission(window.location.href, window.location.hostname, [fieldData]);
//         setLocalStatus('filled');
//         setShowNamePrompt(false);
//         setExpanded(false);
//       } catch (err) {
//         console.error('[AI Autofill] Failed to save field', err);
//       }
//     }
//   };

//   const isSaveMode = localStatus === 'missing' && hasValue;
//   const configKey = isSaveMode ? 'save' : localStatus;
//   const config = STATUS_CONFIG[configKey] || STATUS_CONFIG.missing;
//   const confidence = suggestion?.confidence ? Math.round(suggestion.confidence * 100) : 0;

//   // Don't render anything if there's no suggestion and the field is empty
//   if (localStatus === 'missing' && !hasValue) {
//     return null; 
//   }

//   const top = rect ? rect.top + window.scrollY - 24 : 0;
//   // Position top right, just outside the field vertically, aligned to the right edge
//   const left = rect ? rect.right + window.scrollX - 22 : 0;

//   const displayValue = suggestion?.isSensitive 
//     ? suggestion.value?.slice(0, 2) + '••••' + suggestion.value?.slice(-2)
//     : suggestion?.value;

//   return (
//     <div
//       ref={overlayRef}
//       className="ai-af-inline-btn"
//       onMouseEnter={() => {
//         isHovered.current = true;
//         setExpanded(true);
//       }}
//       onMouseLeave={() => {
//         isHovered.current = false;
//         if (document.activeElement !== field?.element) {
//           setExpanded(false);
//         }
//       }}
//       style={{
//         position: 'absolute',
//         top: `${top}px`,
//         left: `${left}px`,
//         zIndex: expanded ? 2147483645 : 2147483640,
//         fontFamily: "'Inter', system-ui, sans-serif",
//         fontSize: '11px',
//         lineHeight: 1.2,
//       }}
//     >
//       {/* Status icon button */}
//       <div
//         onClick={handleApplyClick}
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           width: '22px',
//           height: '22px',
  
    
//           color: config.color,
//           cursor: 'pointer',
//           userSelect: 'none',
//           backdropFilter: 'blur(8px)',
//           boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
//           transition: 'all 0.15s ease',
//         }}
//         onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
//         onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
//         title={`${config.label} ${localStatus !== 'missing' ? `— ${confidence}% confidence.` : ''} Click to ${localStatus === 'suggested' ? 'auto-fill' : isSaveMode ? 'save' : 'edit'}`}
//       >
//         <span style={{ fontSize: '13px' }}>{config.emoji}</span>
//       </div>

//       {/* Expanded popover */}
//       {expanded && (
//         <div
//           style={{
//             position: 'absolute',
//             top: `${(rect?.height || 0) + 24}px`,
//             right: 0,
//             marginTop: '8px',
//             width: '240px',
//             background: '#1a1d27',
//             border: '1px solid #2e3248',
//             borderRadius: '10px',
//             padding: '10px',
//             boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
//             zIndex: 2147483641,
//             animation: 'ai-af-slide-up 0.15s ease-out',
//           }}
//         >
//           {/* Header */}
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
//             <span style={{ color: '#a0a8c0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
//               AI Autofill
//             </span>
//             <span style={{ color: config.color, fontSize: '10px', fontWeight: 600 }}>
//               {config.label}
//             </span>
//           </div>

//           {/* Confidence bar */}
//           <div style={{ marginBottom: '8px' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
//               <span style={{ color: '#6b7280', fontSize: '10px' }}>Confidence</span>
//               <span style={{ color: config.color, fontSize: '10px', fontWeight: 600 }}>{confidence}%</span>
//             </div>
//             <div style={{ height: '3px', background: '#2e3248', borderRadius: '2px', overflow: 'hidden' }}>
//               <div style={{ height: '100%', width: `${confidence}%`, background: config.color, borderRadius: '2px', transition: 'width 0.3s ease' }} />
//             </div>
//           </div>

//           {/* Value / Edit */}
//           {suggestion?.value && !suggestion.isFileInput && !suggestion.options && (
//             <div style={{ marginBottom: '8px' }}>
//               {isEditing ? (
//                 <div>
//                   <input
//                     value={editValue}
//                     onChange={e => setEditValue(e.target.value)}
//                     style={{
//                       width: '100%', padding: '5px 8px', borderRadius: '6px',
//                       border: '1px solid #4e52e8', background: '#0f1117',
//                       color: '#e2e8f0', fontSize: '11px', outline: 'none',
//                       boxSizing: 'border-box',
//                     }}
//                     onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
//                     autoFocus
//                   />
//                   <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
//                     <button onClick={handleEditSubmit} style={btnStyle('#4e52e8')}>Apply</button>
//                     <button onClick={() => setIsEditing(false)} style={btnStyle('#2e3248')}>Cancel</button>
//                   </div>
//                 </div>
//               ) : (
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                   <span style={{ color: '#e2e8f0', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px', whiteSpace: 'nowrap' }}>
//                     {displayValue}
//                   </span>
//                   <button onClick={() => setIsEditing(true)} style={btnStyle('#2e3248', '9px')}>✏️ Edit</button>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Options Dropdown */}
//           {suggestion?.options && !isEditing && (
//             <div style={{ marginBottom: '8px' }}>
//               <div style={{ marginBottom: '8px', color: '#9ca3af', fontSize: '10px' }}>Select an entry:</div>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
//                 {suggestion.options.map((opt, i) => (
//                   <div
//                     key={i}
//                     onClick={() => handleOptionSelect(opt.value)}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.background = '#2e3248';
//                       e.currentTarget.style.borderColor = '#4e52e8';
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.background = '#0f1117';
//                       e.currentTarget.style.borderColor = '#2e3248';
//                     }}
//                     style={{
//                       background: '#0f1117',
//                       border: '1px solid #2e3248',
//                       borderRadius: '6px',
//                       padding: '8px',
//                       cursor: 'pointer',
//                       transition: 'all 0.15s ease',
//                     }}
//                   >
//                     <div style={{ color: '#e2e8f0', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
//                       {opt.label}
//                     </div>
//                     {opt.value && (
//                       <div style={{ color: '#9ca3af', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                         Value: <span style={{ color: '#a5bbfc' }}>{opt.value}</span>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* File Input Document Details */}
//           {suggestion?.isFileInput && suggestion?.document && (
//             <div style={{ marginBottom: '8px' }}>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                 <span style={{ color: '#e2e8f0', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', whiteSpace: 'nowrap' }}>
//                   📄 {suggestion.document.originalName}
//                 </span>
//               </div>
//             </div>
//           )}

//           {/* Apply button inside popover */}
//           {(suggestion?.value || suggestion?.isFileInput) && !suggestion?.options && !isEditing && localStatus !== 'filled' && (
//             <button
//               onClick={(e) => { handleApplyClick(e); }}
//               style={{
//                 ...btnStyle('#4e52e8'),
//                 width: '100%',
//                 justifyContent: 'center',
//                 padding: '6px',
//               }}
//             >
//               ⚡ {suggestion?.isFileInput ? 'Attach Document' : 'Fill This Field'}
//             </button>
//           )}

//           {/* Save New Field UI */}
//           {isSaveMode && !showNamePrompt && (
//             <button
//               onClick={(e) => { handleApplyClick(e); }}
//               style={{ ...btnStyle('#2e3248'), width: '100%', justifyContent: 'center', padding: '6px', marginTop: '8px' }}
//             >
//               💾 Save New Field
//             </button>
//           )}

//           {isSaveMode && showNamePrompt && (
//             <div style={{ marginTop: '8px', padding: '8px', background: '#0f1117', borderRadius: '8px', border: '1px solid #2e3248' }}>
//               <div style={{ marginBottom: '6px', fontSize: '10px', color: '#9ca3af' }}>Name this field to save it:</div>
//               <input
//                 value={customName}
//                 onChange={e => setCustomName(e.target.value)}
//                 placeholder="e.g. Secret Code"
//                 style={{
//                   width: '100%', padding: '5px 8px', borderRadius: '6px',
//                   border: '1px solid #4e52e8', background: '#1a1d27',
//                   color: '#e2e8f0', fontSize: '11px', outline: 'none',
//                   boxSizing: 'border-box', marginBottom: '8px'
//                 }}
//                 autoFocus
//               />
//               <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#a0a8c0', cursor: 'pointer', marginBottom: '8px' }}>
//                 <input 
//                   type="checkbox" 
//                   checked={isSensitive} 
//                   onChange={e => setIsSensitive(e.target.checked)} 
//                   style={{ cursor: 'pointer' }}
//                 />
//                 Encrypt this field
//               </label>
//               <div style={{ display: 'flex', gap: '4px' }}>
//                 <button onClick={handleSaveConfirm} style={{ ...btnStyle('#10b981'), flex: 1, justifyContent: 'center' }}>Save</button>
//                 <button onClick={() => setShowNamePrompt(false)} style={{ ...btnStyle('#2e3248'), flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </div>
//           )}

//         </div>
//       )}
//     </div>
//   );
// }

// const btnStyle = (bg, fontSize = '10px') => ({
//   padding: '4px 8px',
//   borderRadius: '5px',
//   background: bg,
//   color: '#e2e8f0',
//   border: 'none',
//   cursor: 'pointer',
//   fontSize,
//   fontFamily: "'Inter', system-ui, sans-serif",
//   display: 'flex',
//   alignItems: 'center',
//   gap: '2px',
//   fontWeight: 500,
// });

import React, { useState, useEffect, useRef } from 'react';
import { recordCorrection } from '../shared/api.js';

import { saveSubmission } from '../shared/api.js';
import { collectFieldValues } from './SubmissionCapture.js';

/* ------------------------------------------------------------------ */
/* Design tokens — lighter zinc neutrals, muted accent, tight corners  */
/* ------------------------------------------------------------------ */
const ZINC = {
  900: '#18181b',
  800: '#27272a',
  700: '#3f3f46',
  600: '#52525b',
  500: '#71717a',
  400: '#a1a1aa',
  300: '#d4d4d8',
  200: '#e4e4e7',
  100: '#f4f4f5',
};

const ACCENT = '#6366f1'; // indigo — used only for focus states & primary actions
const ACCENT_DIM = 'rgba(99,102,241,0.14)';

const RADIUS = {
  sm: '4px',
  md: '6px',
  lg: '8px',
};

const STATUS_CONFIG = {
  filled: { emoji: '✅', label: 'Filled', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
  suggested: { emoji: '✨', label: 'Suggested', color: '#a5b4fc', bg: ACCENT_DIM, border: 'rgba(99,102,241,0.35)' },
  missing: { emoji: '❌', label: 'Missing', color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.3)' },
  save: { emoji: '💾', label: 'Save field', color: ZINC[300], bg: 'rgba(212,212,216,0.08)', border: ZINC[700] },
};

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

/**
 * FieldOverlay — an inline autofill control rendered inside a form field.
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
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [customName, setCustomName] = useState(field?.label || field?.name || '');
  const [isSensitive, setIsSensitive] = useState(false);
  const overlayRef = useRef(null);
  const isHovered = useRef(false);

  const [localStatus, setLocalStatus] = useState(suggestion?.status || 'missing');
  const [hasValue, setHasValue] = useState(!!(field?.element?.value));

  useEffect(() => {
    setEditValue(suggestion?.value || '');
    setLocalStatus(suggestion?.status || 'missing');
  }, [suggestion]);

  useEffect(() => {
    if (!field || !field.element) return;

    const handleInput = () => setHasValue(!!field.element.value.trim());

    const handleFocus = () => setExpanded(true);
    const handleBlur = () => {
      if (isHovered.current) return;
      setExpanded(false);
      setIsEditing(false);
      setShowNamePrompt(false);
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
        setIsEditing(false);
        setShowNamePrompt(false);
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

  const handleOptionSelect = (optValue) => {
    onEdit?.(optValue);
    setLocalStatus('filled');
    setExpanded(false);
  };

  const handleApplyClick = async (e) => {
    e.preventDefault();
    const canApply = suggestion?.value || suggestion?.isFileInput;
    if (canApply && (localStatus === 'suggested' || localStatus === 'filled')) {
      onApply?.();
      setLocalStatus('filled');
    } else if (localStatus === 'missing' && hasValue) {
      if (!expanded) {
        setExpanded(true);
        return;
      }
      setShowNamePrompt(true);
    }
  };

  const handleSaveConfirm = async () => {
    const val = collectFieldValues([field]);
    if (val.length > 0) {
      try {
        const fieldData = { ...val[0], customName, isSensitive };
        await saveSubmission(window.location.href, window.location.hostname, [fieldData]);
        setLocalStatus('filled');
        setShowNamePrompt(false);
        setExpanded(false);
      } catch (err) {
        console.error('[OneTap] Failed to save field', err);
      }
    }
  };

  const isSaveMode = localStatus === 'missing' && hasValue;
  const configKey = isSaveMode ? 'save' : localStatus;
  const config = STATUS_CONFIG[configKey] || STATUS_CONFIG.missing;
  const confidence = suggestion?.confidence ? Math.round(suggestion.confidence * 100) : 0;
  const fieldLabel = field?.label || field?.name || field?.placeholder || 'This field';

  // Don't render anything if there's no suggestion and the field is empty
  if (localStatus === 'missing' && !hasValue) {
    return null;
  }

  const top = rect ? rect.top + window.scrollY - 24 : 0;
  const left = rect ? rect.right + window.scrollX - 22 : 0;

  const displayValue = suggestion?.isSensitive
    ? suggestion.value?.slice(0, 2) + ' •••• ' + suggestion.value?.slice(-2)
    : suggestion?.value;

  return (
    <div
      ref={overlayRef}
      className="onetap-inline-btn"
      onMouseEnter={() => {
        isHovered.current = true;
        setExpanded(true);
      }}
      onMouseLeave={() => {
        isHovered.current = false;
        if (document.activeElement !== field?.element) {
          setExpanded(false);
        }
      }}
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: expanded ? 2147483645 : 2147483640,
        fontFamily: FONT,
        fontSize: '11px',
        lineHeight: 1.2,
      }}
    >
      {/* Status trigger chip */}
      <div
        onClick={handleApplyClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: RADIUS.md,
          background: ZINC[800],
          border: `1px solid ${expanded ? config.border : ZINC[700]}`,
          color: config.color,
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: expanded ? `0 0 0 3px ${config.bg}` : '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'all 0.15s ease',
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title={`${config.label}${localStatus !== 'missing' ? ` — ${confidence}% confidence` : ''}. Click to ${localStatus === 'suggested' ? 'auto-fill' : isSaveMode ? 'save' : 'edit'}`}
      >
        <span style={{ fontSize: '12px' }}>{config.emoji}</span>
      </div>

      {/* Expanded popover */}
      {expanded && (
        <div
          style={{
            position: 'absolute',
            top: `${(rect?.height || 0) + 26}px`,
            right: 0,
            width: '250px',
            background: ZINC[800],
            border: `1px solid ${ZINC[700]}`,
            borderRadius: RADIUS.lg,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 2147483641,
            overflow: 'hidden',
            animation: 'onetap-slide-up 0.15s ease-out',
          }}
        >
          <div style={{ padding: '11px 12px 10px' }}>
            {/* Header row: field context + status pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '9px', gap: '8px' }}>
              <span
                style={{
                  color: ZINC[300],
                  fontSize: '10px',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {fieldLabel}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: config.color,
                  background: config.bg,
                  border: `1px solid ${config.border}`,
                  borderRadius: RADIUS.sm,
                  padding: '2px 6px',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {config.emoji} {config.label}
              </span>
            </div>

            {/* Confidence bar */}
            {localStatus !== 'missing' && confidence > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: ZINC[500], fontSize: '10px' }}>Confidence</span>
                  <span style={{ color: config.color, fontSize: '10px', fontWeight: 600, fontFamily: MONO }}>
                    {confidence}%
                  </span>
                </div>
                <div style={{ height: '3px', background: ZINC[700], borderRadius: RADIUS.sm, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${confidence}%`,
                      background: config.color,
                      borderRadius: RADIUS.sm,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Value / Edit */}
            {suggestion?.value && !suggestion.isFileInput && !suggestion.options && (
              <div style={{ marginBottom: '10px' }}>
                {isEditing ? (
                  <div>
                    <input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      style={{
                        width: '100%', padding: '6px 8px', borderRadius: RADIUS.md,
                        border: `1px solid ${ACCENT}`, background: ZINC[900],
                        color: ZINC[100], fontSize: '11px', fontFamily: MONO, outline: 'none',
                        boxSizing: 'border-box',
                        boxShadow: `0 0 0 3px ${ACCENT_DIM}`,
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
                      <button onClick={handleEditSubmit} style={btnStyle('brand')}>Apply</button>
                      <button onClick={() => setIsEditing(false)} style={btnStyle('ghost')}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: ZINC[900],
                      border: `1px solid ${ZINC[700]}`,
                      borderRadius: RADIUS.md,
                      padding: '6px 8px',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        color: ZINC[200],
                        fontSize: '11px',
                        fontFamily: MONO,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {displayValue}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{ ...btnStyle('ghost'), padding: '3px 6px', flexShrink: 0 }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Options list */}
            {suggestion?.options && !isEditing && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ marginBottom: '6px', color: ZINC[500], fontSize: '10px' }}>Select an entry</div>
                <div
                  style={{
                    border: `1px solid ${ZINC[700]}`,
                    borderRadius: RADIUS.md,
                    overflow: 'hidden',
                    maxHeight: '190px',
                    overflowY: 'auto',
                  }}
                >
                  {suggestion.options.map((opt, i) => (
                    <div
                      key={i}
                      onClick={() => handleOptionSelect(opt.value)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = ZINC[700]; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        padding: '8px 9px',
                        cursor: 'pointer',
                        borderBottom: i < suggestion.options.length - 1 ? `1px solid ${ZINC[700]}` : 'none',
                        transition: 'background 0.12s ease',
                      }}
                    >
                      <div style={{ color: ZINC[100], fontSize: '11px', fontWeight: 600 }}>
                        {opt.label}
                      </div>
                      {opt.value && (
                        <div
                          style={{
                            color: ZINC[500],
                            fontSize: '10px',
                            fontFamily: MONO,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {opt.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Input Document Details */}
            {suggestion?.isFileInput && suggestion?.document && (
              <div
                style={{
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: ZINC[900],
                  border: `1px solid ${ZINC[700]}`,
                  borderRadius: RADIUS.md,
                  padding: '7px 8px',
                }}
              >
                <span style={{ fontSize: '12px' }}>📄</span>
                <span
                  style={{
                    color: ZINC[200],
                    fontSize: '11px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {suggestion.document.originalName}
                </span>
              </div>
            )}

            {/* Apply button */}
            {(suggestion?.value || suggestion?.isFileInput) && !suggestion?.options && !isEditing && localStatus !== 'filled' && (
              <button
                onClick={(e) => { handleApplyClick(e); }}
                style={{ ...btnStyle('brand'), width: '100%', justifyContent: 'center', padding: '7px' }}
              >
                ⚡ {suggestion?.isFileInput ? 'Attach document' : 'Fill this field'}
              </button>
            )}

            {/* Save New Field UI */}
            {isSaveMode && !showNamePrompt && (
              <button
                onClick={(e) => { handleApplyClick(e); }}
                style={{ ...btnStyle('ghost'), width: '100%', justifyContent: 'center', padding: '7px' }}
              >
                💾 Save new field
              </button>
            )}

            {isSaveMode && showNamePrompt && (
              <div style={{ padding: '9px', background: ZINC[900], borderRadius: RADIUS.md, border: `1px solid ${ZINC[700]}` }}>
                <div style={{ marginBottom: '6px', fontSize: '10px', color: ZINC[500] }}>Name this field to save it</div>
                <input
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Secret Code"
                  style={{
                    width: '100%', padding: '6px 8px', borderRadius: RADIUS.md,
                    border: `1px solid ${ACCENT}`, background: ZINC[800],
                    color: ZINC[100], fontSize: '11px', outline: 'none',
                    boxSizing: 'border-box', marginBottom: '8px',
                    boxShadow: `0 0 0 3px ${ACCENT_DIM}`,
                  }}
                  autoFocus
                />
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10.5px',
                    color: ZINC[400],
                    cursor: 'pointer',
                    marginBottom: '9px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSensitive}
                    onChange={e => setIsSensitive(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  🔒 Encrypt this field
                </label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={handleSaveConfirm} style={{ ...btnStyle('success'), flex: 1, justifyContent: 'center' }}>Save</button>
                  <button onClick={() => setShowNamePrompt(false)} style={{ ...btnStyle('ghost'), flex: 1, justifyContent: 'center' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Footer branding — small, quiet */}
          <div
            style={{
              padding: '5px 12px 6px',
              borderTop: `1px solid ${ZINC[700]}`,
              textAlign: 'center',
            }}
          >
            <span style={{ color: ZINC[600], fontSize: '8.5px', letterSpacing: '0.03em' }}>
              OneTap
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes onetap-slide-up {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const btnStyle = (variant = 'ghost') => {
  const variants = {
    brand: { background: ACCENT, color: '#fff' },
    ghost: { background: ZINC[700], color: ZINC[200] },
    success: { background: '#10b981', color: '#fff' },
  };
  return {
    padding: '5px 9px',
    borderRadius: RADIUS.sm,
    border: 'none',
    cursor: 'pointer',
    fontSize: '10.5px',
    fontFamily: FONT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontWeight: 600,
    transition: 'filter 0.15s ease',
    ...variants[variant],
  };
};