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

// ── Initialize ────────────────────────────────────────────────────────────────

async function init() {
  settings = await getSettings().catch(() => ({ enabled: true, showOverlays: true }));
  if (!settings.enabled) {
    console.log('[AI Autofill] Disabled by user settings');
    return;
  }

  allFields = detectAllFields();
  if (allFields.length === 0) return;

  console.log(`[AI Autofill] Detected ${allFields.length} form fields`);

  // Start submission capture immediately (read-only)
  captureFormSubmissions(allFields);

  // Fetch autofill suggestions from backend
  await loadAndApplySuggestions(allFields);

  // Watch for dynamically added fields
  watchForNewFields(async (newFields) => {
    allFields = [...allFields, ...newFields];
    await loadAndApplySuggestions(newFields);
  });

  if (settings.showOverlays) {
    renderGlobalButton();
  }
}


function renderGlobalButton() {
  if (globalButtonRoot) return;
  const container = document.createElement('div');
  container.id = 'ai-autofill-global-btn-container';
  document.body.appendChild(container);
  globalButtonRoot = createRoot(container);
  globalButtonRoot.render(
    <GlobalFillButton 
      onFillAll={async () => {
        let filledCount = 0;
        await processSuggestions(allFields, suggestions, settings, (fieldIdx, value, suggestion) => {
          updateOverlayStatus(allFields[fieldIdx]?.fingerprint, 'filled');
          filledCount++;
        });
        if (filledCount > 0) {
          showToast(`✨ OneTap: Auto-filled ${filledCount} field${filledCount > 1 ? 's' : ''}. Review changes.`, 'success');
        }
      }} 
      onSaveAll={async () => {
        const vals = collectFieldValues(allFields);
        if (vals.length > 0) {
          try {
            showToast('💾 OneTap: Saving new fields...', 'save', 2000);
            await saveSubmission(window.location.href, window.location.hostname, vals);
            showToast('✅ Saved successfully!', 'success');
          } catch (err) {
            console.error('[AI Autofill] Failed to save all new fields', err);
            showToast('❌ Failed to save fields', 'error');
          }
        } else {
          showToast('No filled fields to save', 'info');
        }
      }}
    />
  );
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

// ── Boot ──────────────────────────────────────────────────────────────────────

// Wait for page to be interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Small delay to let SPAs render
  setTimeout(init, 500);
}
