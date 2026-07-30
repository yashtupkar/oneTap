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
import { fetchSuggestions, getSettings, saveSubmission } from '../shared/api.js';
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
          
          const fieldsToAnalyze = allFields.slice(suggestions.length);
          if (fieldsToAnalyze.length > 0) {
            showToast('✨ Analyzing form fields...', 'info');
            await loadAndApplySuggestions(fieldsToAnalyze);
          }
          
          let filledCount = 0;
          await processSuggestions(allFields, suggestions, settings, (fieldIdx, value, suggestion) => {
            updateOverlayStatus(allFields[fieldIdx]?.fingerprint, 'filled');
            filledCount++;
          });
          setIsLoading(false);
          
          if (filledCount > 0) {
            showToast(`✨ OneTap: Auto-filled ${filledCount} field${filledCount > 1 ? 's' : ''}. Review changes.`, 'success');
          } else if (fieldsToAnalyze.length > 0) {
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
function renderOverlays(fields, fieldSuggestions) {
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
        onApply={() => handleApply(field, idx, suggestion)}
        onEdit={(newValue) => handleEdit(field, idx, suggestion, newValue)}
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
          onApply={() => handleApply(field, idx, suggestion)}
          onEdit={(newValue) => handleEdit(field, idx, suggestion, newValue)}
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

function handleEdit(field, idx, suggestion, newValue) {
  applyFill(field, newValue, suggestion);
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
