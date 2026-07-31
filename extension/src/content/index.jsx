/**
 * content/index.js — Content Script Entry Point
 *
 * Orchestrates form detection, autofill suggestions, field overlays,
 * and submission capture on every page.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { detectAllFields, watchForNewFields } from './FormDetector.js';
import { processSuggestions, applyFill } from './AutofillEngine.js';
import { captureFormSubmissions, collectFieldValues } from './SubmissionCapture.js';
import { FieldOverlay } from './FieldOverlay.jsx';
import { TextSelectionAssistant } from './TextSelectionAssistant.jsx';
import { GlobalFillButton } from './GlobalFillButton.jsx';
import { fetchSuggestions, getSettings, saveSubmission, getProfile } from '../shared/api.js';
import { DEFAULT_SCHEMA_DEFINITIONS } from '../shared/constants.js';
import { showToast } from './Toast.js';
import './content.css';

// ── State ─────────────────────────────────────────────────────────────────────
let allFields = [];
let suggestions = [];
let overlayRoots = new Map(); // fieldFingerprint → { container, root }

let globalButtonRoot = null;
let settings = null;
let textSelectionRoot = null;
let textSelectionContainer = null;

// ── Initialize ────────────────────────────────────────────────────────────────

async function init() {
  settings = await getSettings().catch(() => ({ enabled: true, showOverlays: true }));
  if (!settings.enabled) {
    console.log('[AI Autofill] Disabled by user settings');
    return;
  }
  
  // Listen for group autofill events
  window.addEventListener('ONETAP_FILL_GROUP', async (e) => {
    const { groupId, sourceIdx } = e.detail;
    if (sourceIdx === undefined || !groupId) return;
    
    const categoryId = groupId.split('_')[0];
    
    // Partition fields by repetition of profileKeys in this category
    const partitions = [];
    let currentPartition = [];
    let currentSeen = new Set();
    
    for (let i = 0; i < allFields.length; i++) {
      const sugg = suggestions[i];
      if (sugg && sugg.profileKey && sugg.profileKey.startsWith(categoryId + '.')) {
        if (currentSeen.has(sugg.profileKey)) {
          partitions.push(currentPartition);
          currentPartition = [];
          currentSeen.clear();
        }
        currentPartition.push(i);
        currentSeen.add(sugg.profileKey);
      }
    }
    if (currentPartition.length > 0) partitions.push(currentPartition);
    
    const targetPartition = partitions.find(p => p.includes(sourceIdx));
    if (!targetPartition) return;
    
    let filledCount = 0;
    
    for (const i of targetPartition) {
      if (i === sourceIdx) continue;
      const sugg = suggestions[i];
      if (sugg && sugg.status === 'suggested' && sugg.options) {
        const matchedOpt = sugg.options.find(o => o.groupId === groupId);
        if (matchedOpt) {
          await applyFill(allFields[i], matchedOpt.value, sugg);
          sugg.status = 'filled';
          filledCount++;
        }
      }
    }
    
    if (filledCount > 0 && settings.showOverlays) {
       renderOverlays(allFields, suggestions, flattenedProfileData);
    }
  });

  allFields = detectAllFields();

  if (allFields.length > 0) {
    console.log(`[AI Autofill] Detected ${allFields.length} form fields initially`);
    // Start submission capture immediately (read-only)
    // captureFormSubmissions(allFields); // Disabled for now per user request
  }

  // Watch for dynamically added fields
  watchForNewFields(async (newFields) => {
    allFields = [...allFields, ...newFields];
  });

  if (settings.showOverlays) {
    renderGlobalButton();
  }

  // Watch for text selection
  document.addEventListener('mouseup', handleTextSelection);
}


import { SaveFieldsModal } from './SaveFieldsModal.jsx';

function normalizeString(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function performLocalMatching(fields) {
  let profileData = {};
  try {
    const res = await getProfile();
    profileData = res?.profile?.profileData || {};
  } catch (err) {
    console.warn('[OneTap] Failed to fetch profile for local matching', err);
  }

  const results = new Array(fields.length).fill(null);
  const matchMap = new Map();
  const flattenedProfileData = [];
  
  for (const category of DEFAULT_SCHEMA_DEFINITIONS) {
    const categoryData = profileData[category.id];
    if (!categoryData) continue;
    
    const items = Array.isArray(categoryData) ? categoryData : [categoryData];
    
    for (const def of category.fields) {
      const options = [];
      
      items.forEach((data, index) => {
        if (!data) return;
        const value = data[def.key];
        if (value !== undefined && value !== null && value !== '') {
          const itemLabel = category.title + (items.length > 1 ? ` ${index + 1}` : '');
          flattenedProfileData.push({
            category: itemLabel,
            label: def.label,
            value: value,
            isSensitive: def.sensitive || false,
            profileKey: `${category.id}.${def.key}`,
          });

          options.push({
            label: `${itemLabel} - ${def.label}`,
            value: value,
            groupId: `${category.id}_${index}`
          });
        }
      });

      if (options.length > 0) {
        const keysToSet = [
          normalizeString(def.key),
          normalizeString(def.label),
          ...(def.aiAliases || []).map(normalizeString)
        ];

        for (const k of keysToSet) {
          if (!k) continue;
          
          if (matchMap.has(k)) {
            const existing = matchMap.get(k);
            let mergedOptions = existing.options ? [...existing.options] : [existing._singleOption];
            
            for (const opt of options) {
              if (!mergedOptions.find(o => o.value === opt.value)) {
                mergedOptions.push(opt);
              }
            }
            
            existing.options = mergedOptions;
          } else {
            const suggestionObj = {
              value: options[0].value,
              status: 'suggested',
              confidence: 1.0,
              profileKey: `${category.id}.${def.key}`,
              isSensitive: def.sensitive || false,
              _singleOption: options[0]
            };
            
            if (options.length > 1) {
              suggestionObj.options = options;
            }
            
            matchMap.set(k, suggestionObj);
          }
        }
      }
    }
    
    // Process custom fields added directly to this category (e.g. Email 3)
    const knownKeys = new Set(category.fields.map(def => def.key));
    const extraOptionsMap = {};
    items.forEach((data, index) => {
      if (!data) return;
      for (const [key, value] of Object.entries(data)) {
        if (!knownKeys.has(key) && value !== undefined && value !== null && value !== '') {
          const itemLabel = category.title + (items.length > 1 ? ` ${index + 1}` : '');
          const label = key.replace(/_/g, ' ');
          
          flattenedProfileData.push({
            category: itemLabel,
            label: label,
            value: value,
            isSensitive: false,
            profileKey: `${category.id}.${key}`,
          });
          
          if (!extraOptionsMap[key]) extraOptionsMap[key] = [];
          extraOptionsMap[key].push({
            label: `${itemLabel} - ${label}`,
            value: value,
            groupId: `${category.id}_${index}`
          });
        }
      }
    });

    for (const [key, options] of Object.entries(extraOptionsMap)) {
      const keysToSet = [normalizeString(key), normalizeString(key.replace(/_/g, ' '))];
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('email')) keysToSet.push('email');
      if (lowerKey.includes('phone') || lowerKey.includes('mobile')) keysToSet.push('phone');
      if (lowerKey.includes('url') || lowerKey.includes('link')) keysToSet.push('url', 'website');

      for (const k of keysToSet) {
        if (!k) continue;
        if (matchMap.has(k)) {
          const existing = matchMap.get(k);
          let mergedOptions = existing.options ? [...existing.options] : [existing._singleOption];
          for (const opt of options) {
            if (!mergedOptions.find(o => o.value === opt.value)) {
              mergedOptions.push(opt);
            }
          }
          existing.options = mergedOptions;
        } else {
          const suggestionObj = {
            value: options[0].value,
            status: 'suggested',
            confidence: 1.0,
            profileKey: `${category.id}.${key}`,
            isSensitive: false,
            _singleOption: options[0]
          };
          if (options.length > 1) {
            suggestionObj.options = options;
          }
          matchMap.set(k, suggestionObj);
        }
      }
    }
  }

  // Include custom fields
  if (profileData.customFields) {
    for (const [key, fieldData] of Object.entries(profileData.customFields)) {
      if (!fieldData || !fieldData.value) continue;
      
      const val = fieldData.value;
      const isSensitive = fieldData.sensitive || false;
      const label = key.replace(/_/g, ' ');

      flattenedProfileData.push({
        category: 'Custom Fields',
        label: label,
        value: val,
        isSensitive: isSensitive,
        profileKey: `customFields.${key}`,
      });

      const opt = { label: `Custom Fields - ${label}`, value: val };
      
      const suggestionObj = {
        value: val,
        status: 'suggested',
        confidence: 1.0,
        profileKey: `customFields.${key}`,
        isSensitive: isSensitive,
        _singleOption: opt
      };

      const keysToSet = [normalizeString(key)];
      if (fieldData.type === 'email') keysToSet.push('email');
      if (fieldData.type === 'tel') keysToSet.push('phone');
      if (fieldData.type === 'url') keysToSet.push('url', 'website');

      for (const k of keysToSet) {
        if (!k) continue;
        if (matchMap.has(k)) {
          const existing = matchMap.get(k);
          let mergedOptions = existing.options ? [...existing.options] : [existing._singleOption];
          if (!mergedOptions.find(o => o.value === val)) {
            mergedOptions.push(opt);
          }
          existing.options = mergedOptions;
        } else {
          matchMap.set(k, { ...suggestionObj });
        }
      }
    }
  }

  const unknownFields = [];
  const unknownIndices = [];

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const nName = normalizeString(f.name);
    const nId = normalizeString(f.id);
    const nLabel = normalizeString(f.label);

    let match = matchMap.get(nName) || matchMap.get(nId) || matchMap.get(nLabel);
    
    if (match) {
      results[i] = { ...match };
    } else {
      results[i] = { status: 'loading' };
      unknownFields.push(f);
      unknownIndices.push(i);
    }
  }

  return { results, unknownFields, unknownIndices, flattenedProfileData };
}

function GlobalUI() {
  const [fieldsToSave, setFieldsToSave] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <>
      <GlobalFillButton 
        isLoading={isLoading}
        onFillAll={async () => {
          if (allFields.length === 0) {
            showToast('No form fields detected on this page.', 'info');
            return;
          }
          setIsLoading(true);
          
          showToast('⚡ Extracting profile data & matching fields...', 'info');
          
          const { results: localResults, unknownFields, unknownIndices, flattenedProfileData } = await performLocalMatching(allFields);
          suggestions = localResults;
          
          if (settings.showOverlays) {
            renderOverlays(allFields, suggestions, flattenedProfileData);
          }

          let filledCount = 0;
          for (let i = 0; i < allFields.length; i++) {
             const sugg = suggestions[i];
             if (sugg && sugg.status === 'suggested' && sugg.value) {
                if (sugg.options && sugg.options.length > 1) continue;
                await applyFill(allFields[i], sugg.value, sugg);
                sugg.status = 'filled';
                filledCount++;
             }
          }
          
          if (settings.showOverlays) {
             renderOverlays(allFields, suggestions, flattenedProfileData);
          }
          
          if (unknownFields.length > 0) {
            showToast(`✨ Analyzing ${unknownFields.length} unknown fields...`, 'info');
            try {
              const fieldDescriptors = unknownFields.map(f => ({
                name: f.name, id: f.id, label: f.label, placeholder: f.placeholder, type: f.type, accept: f.accept || '',
              }));
              const response = await fetchSuggestions(fieldDescriptors, window.location.hostname);
              const aiSuggestions = response?.suggestions || [];
              
              let aiFilledCount = 0;
              for (let j = 0; j < unknownIndices.length; j++) {
                const originalIdx = unknownIndices[j];
                const sugg = aiSuggestions[j] || { status: 'missing' };
                suggestions[originalIdx] = sugg;
                
                if (sugg.status === 'suggested' && sugg.value) {
                  if (sugg.options && sugg.options.length > 1) continue;
                  await applyFill(allFields[originalIdx], sugg.value, sugg);
                  suggestions[originalIdx].status = 'filled';
                  aiFilledCount++;
                }
              }
              filledCount += aiFilledCount;
              
            } catch (err) {
              console.warn('[AI Autofill] Failed to fetch suggestions:', err.message);
              for (const originalIdx of unknownIndices) {
                 suggestions[originalIdx] = { status: 'missing' };
              }
            }
            
            if (settings.showOverlays) {
              renderOverlays(allFields, suggestions, flattenedProfileData);
            }
          }
          
          setIsLoading(false);
          
          if (filledCount > 0) {
            showToast(`✨ OneTap: Auto-filled ${filledCount} field${filledCount > 1 ? 's' : ''}. Review changes.`, 'success');
          } else {
            showToast('No fields could be auto-filled.', 'info');
          }
        }} 
        onSaveAll={() => {
          const vals = collectFieldValues(allFields);
          if (vals.length > 0) {
            setFieldsToSave(vals);
          } else {
            showToast('No filled fields to save', 'info');
          }
        }}
      />
      {fieldsToSave && (
        <SaveFieldsModal 
          fields={fieldsToSave}
          onComplete={() => setFieldsToSave(null)}
          onCancel={() => setFieldsToSave(null)}
        />
      )}
    </>
  );
}

function renderGlobalButton() {
  if (globalButtonRoot) return;
  const container = document.createElement('div');
  container.id = 'ai-autofill-global-btn-container';
  document.body.appendChild(container);
  globalButtonRoot = createRoot(container);
  globalButtonRoot.render(<GlobalUI />);
}

/**
 * Fetches suggestions for a list of fields, renders overlays, and auto-fills.
 * @param {import('./FormDetector.js').FormField[]} fields
 */
async function loadAndApplySuggestions(fields) {
  try {
    const fieldDescriptors = fields.map(f => ({
      name: f.name,
      id: f.id,
      label: f.label,
      placeholder: f.placeholder,
      type: f.type,
      accept: f.accept || '',
    }));

    const response = await fetchSuggestions(fieldDescriptors, window.location.hostname);
    const newSuggestions = response?.suggestions || [];

    // Store suggestions for later reference
    suggestions = [...suggestions, ...newSuggestions];

    // Render overlays if enabled
    if (settings.showOverlays) {
      renderOverlays(fields, newSuggestions);
    }
  } catch (err) {
    console.warn('[AI Autofill] Failed to fetch suggestions:', err.message);
  }
}

// ── Overlay Management ────────────────────────────────────────────────────────

/**
 * Renders FieldOverlay React components beside each detected field.
 */
function renderOverlays(fields, fieldSuggestions, flattenedProfileData = []) {
  // Create a single container for all overlays (positioned via inline styles)
  let overlayContainer = document.getElementById('ai-autofill-overlays');
  if (!overlayContainer) {
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'ai-autofill-overlays';
    overlayContainer.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:2147483630;';
    document.body.appendChild(overlayContainer);
  }

  fields.forEach((field, idx) => {
    const suggestion = fieldSuggestions[idx];
    if (!suggestion) return;

    if (suggestion.profileKey) {
      field.element.setAttribute('data-ai-profile-key', suggestion.profileKey);
    }
    
    // Disable default browser autofill to prevent overlapping our overlay
    field.element.setAttribute('autocomplete', 'one-tap-off');

    const rect = field.element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Skip if overlay already exists for this field
    if (overlayRoots.has(field.fingerprint)) {
      // Update existing overlay
      const { root } = overlayRoots.get(field.fingerprint);
      root.render(
        <FieldOverlay
          suggestion={suggestion}
          field={field}
          rect={rect}
          flattenedProfileData={flattenedProfileData}
          onApply={() => handleApply(field, idx, suggestion)}
          onEdit={(newValue) => handleEdit(field, idx, suggestion, newValue)}
          onMagicRewrite={() => {
            if (field.element.value) {
              renderTextSelectionUI(field.element.getBoundingClientRect(), field.element.value, true);
            }
          }}
        />
      );
      return;
    }

    // Create new overlay container
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;top:0;left:0;pointer-events:auto;';
    overlayContainer.appendChild(container);

    const root = createRoot(container);
    root.render(
      <FieldOverlay
        suggestion={suggestion}
        field={field}
        rect={rect}
        flattenedProfileData={flattenedProfileData}
        onApply={() => handleApply(field, idx, suggestion)}
        onEdit={(newValue, opt) => handleEdit(field, idx, suggestion, newValue, opt)}
      />
    );

    overlayRoots.set(field.fingerprint, { container, root });
  });

  // Reposition on scroll/resize
  const reposition = () => {
    fields.forEach((field, idx) => {
      const entry = overlayRoots.get(field.fingerprint);
      if (!entry) return;
      const rect = field.element.getBoundingClientRect();
      const suggestion = fieldSuggestions[idx];
      entry.root.render(
        <FieldOverlay
          suggestion={suggestion}
          field={field}
          rect={rect}
          flattenedProfileData={flattenedProfileData}
          onApply={() => handleApply(field, idx, suggestion)}
          onEdit={(newValue, opt) => handleEdit(field, idx, suggestion, newValue, opt)}
          onMagicRewrite={() => {
            if (field.element.value) {
              renderTextSelectionUI(field.element.getBoundingClientRect(), field.element.value, true);
            }
          }}
        />
      );
    });
  };

  window.addEventListener('scroll', reposition, { passive: true });
  window.addEventListener('resize', reposition, { passive: true });
}

function updateOverlayStatus(fingerprint, newStatus) {
  // Status update triggers a re-render — find the field and update suggestion
  // (handled via React state in FieldOverlay component)
}

function handleApply(field, idx, suggestion) {
  applyFill(field, suggestion.value, suggestion);
}

function handleEdit(field, idx, suggestion, newValue, opt) {
  applyFill(field, newValue, suggestion).then(() => {
    if (opt && opt.groupId) {
      window.dispatchEvent(new CustomEvent('ONETAP_FILL_GROUP', { detail: { groupId: opt.groupId } }));
    }
  });
}

// ── Text Selection UI ─────────────────────────────────────────────────────────

function handleTextSelection(e) {
  if (!settings || !settings.enabled) return;

  // Ignore events that happen inside our own UI
  if (textSelectionContainer && textSelectionContainer.contains(e.target)) {
    return;
  }

  const isInputField = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;

  setTimeout(() => {
    let text = '';
    let rect = null;

    // Handle standard inputs/textareas
    if (isInputField && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      if (start !== undefined && end !== undefined && start !== end) {
        text = e.target.value.substring(start, end).trim();
        rect = e.target.getBoundingClientRect(); // Rough approximation for input/textarea
      }
    }

    // Fallback to window.getSelection
    if (!text) {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        clearTextSelectionUI();
        return;
      }
      text = selection.toString().trim();
      
      if (text && text.length >= 3) {
        try {
          const range = selection.getRangeAt(0);
          rect = range.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) rect = null;
          else {
            let endRect = rect;
            try {
              const endRange = range.cloneRange();
              endRange.collapse(false);
              let tempRect = endRange.getBoundingClientRect();
              
              if (tempRect.width === 0 && tempRect.height === 0 && range.endOffset > 0) {
                endRange.setStart(range.endContainer, range.endOffset - 1);
                endRange.setEnd(range.endContainer, range.endOffset);
                tempRect = endRange.getBoundingClientRect();
              }
              
              if (tempRect.width > 0 || tempRect.height > 0) {
                endRect = tempRect;
              }
            } catch(err) {}
            rect = endRect;
          }
        } catch (err) {}
      }
    }

    if (!text || text.length < 3 || !rect) {
      clearTextSelectionUI();
      return;
    }

    renderTextSelectionUI(rect, text, isInputField);
  }, 10);
}

function renderTextSelectionUI(rect, text, isInputField = false) {
  if (!textSelectionContainer) {
    textSelectionContainer = document.createElement('div');
    textSelectionContainer.id = 'ai-autofill-text-selection';
    document.body.appendChild(textSelectionContainer);
    textSelectionRoot = createRoot(textSelectionContainer);
  }

  textSelectionRoot.render(
    <TextSelectionAssistant 
      rect={rect} 
      selectedText={text} 
      isInputField={isInputField}
      onDismiss={clearTextSelectionUI} 
    />
  );
}

function clearTextSelectionUI() {
  if (textSelectionRoot) {
    textSelectionRoot.render(null);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────

// Wait for page to be interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Small delay to let SPAs render
  setTimeout(init, 500);
}
