/**
 * AutofillEngine.js — Applies autofill suggestions to form fields.
 *
 * Rules:
 * - Never auto-submits forms.
 * - Shows confirmation for sensitive fields (passportNumber, pan, etc.)
 * - Always asks before filling file inputs.
 * - Fires native events so React/Vue/Angular SPA forms react correctly.
 */

import { fetchSuggestions } from '../shared/api.js';
import { showConfirmationDialog } from './ConfirmationDialog.js';

const SENSITIVE_KEYS = new Set([
  'passportNumber', 'panNumber', 'aadhaarNumber', 'drivingLicenseNumber',
  'dateOfBirth', 'expectedSalary',
]);

/**
 * Dispatches native input/change events on an element so frameworks
 * (React, Vue, Angular) detect the programmatic value change.
 *
 * @param {HTMLElement} el
 */
function dispatchNativeEvents(el) {
  ['input', 'change', 'blur'].forEach(eventName => {
    el.dispatchEvent(new Event(eventName, { bubbles: true }));
  });
  
  // For React synthetic events
  const proto = el instanceof HTMLTextAreaElement 
    ? window.HTMLTextAreaElement.prototype 
    : window.HTMLInputElement.prototype;
    
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
  
  if (nativeSetter?.set) {
    try {
      nativeSetter.set.call(el, el.value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (e) {
      console.warn('[AI Autofill] Failed to dispatch native event:', e);
    }
  }
}

/**
 * Fills a single text/email/tel/number/date/textarea input.
 *
 * @param {HTMLElement} el
 * @param {string} value
 */
function fillTextInput(el, value) {
  el.focus();
  el.value = value;
  dispatchNativeEvents(el);
  el.blur();
}

/**
 * Fills a <select> element by value or label text match.
 *
 * @param {HTMLSelectElement} el
 * @param {string} value
 */
function fillSelect(el, value) {
  const lower = value.toLowerCase();
  let matched = false;

  for (const option of el.options) {
    if (
      option.value.toLowerCase() === lower ||
      option.text.toLowerCase() === lower ||
      option.text.toLowerCase().includes(lower)
    ) {
      el.value = option.value;
      matched = true;
      break;
    }
  }

  if (matched) {
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Fills a radio button group by selecting the option that best matches the value.
 *
 * @param {string} groupName
 * @param {string} value
 */
function fillRadioGroup(groupName, value) {
  const radios = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(groupName)}"]`);
  const lower = value.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const radio of radios) {
    const radioLabel = radio.value.toLowerCase();
    const radioText = radio.closest('label')?.textContent?.toLowerCase() || '';
    let score = 0;
    if (radioLabel === lower || radioText.includes(lower)) score = 1;
    else if (lower.includes(radioLabel) || radioLabel.includes(lower)) score = 0.7;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = radio;
    }
  }

  if (bestMatch && !bestMatch.checked) {
    bestMatch.checked = true;
    bestMatch.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Fills a checkbox (checks it if value is truthy / "yes" / "true").
 *
 * @param {HTMLInputElement} el
 * @param {string} value
 */
function fillCheckbox(el, value) {
  const truthy = ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
  if (el.checked !== truthy) {
    el.checked = truthy;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Core fill function — dispatches to the right filler based on field type.
 *
 * @param {import('./FormDetector.js').FormField} field
 * @param {string} value
 */
export async function applyFill(field, value, suggestion = null) {
  const el = field.element;
  if (!el) return;

  // We allow value to be null/undefined for file inputs, so only abort if both are missing
  if (!value && field.type !== 'file') return;

  switch (field.type) {
    case 'select':
    case 'select-one':
    case 'select-multiple':
      fillSelect(el, value);
      break;
    case 'radio':
      fillRadioGroup(field.name, value);
      break;
    case 'checkbox':
      fillCheckbox(el, value);
      break;
    case 'file':
      if (suggestion?.document?.downloadUrl) {
        try {
          // Fetch settings to get the correct serverUrl
          const stored = await chrome.storage.local.get('settings');
          const serverUrl =  'http://localhost:3001';
          
          const res = await fetch(`${serverUrl}${suggestion.document.downloadUrl}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          
          const file = new File([blob], suggestion.document.originalName, { type: suggestion.document.mimeType });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          el.files = dataTransfer.files;
          
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) {
          console.error('[AI Autofill] Failed to download and attach file:', e);
        }
      }
      break;
    default:
      fillTextInput(el, value);
  }
}

/**
 * Processes a list of suggestions and applies fills.
 * Shows confirmation dialogs for sensitive or low-confidence fields.
 *
 * @param {import('./FormDetector.js').FormField[]} fields - Detected form fields
 * @param {Array} suggestions - Suggestions from the API
 * @param {object} settings - User settings
 * @param {function} onFilled - Called when a field is filled: (fieldIndex, value, suggestion)
 */
export async function processSuggestions(fields, suggestions, settings, onFilled) {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const suggestion = suggestions[i];

    if (!suggestion || !suggestion.value || suggestion.status === 'missing') continue;
    if (suggestion.isFileInput) continue; // Handled separately by overlay
    if (suggestion.options) continue; // Skip auto-fill if multiple options are available

    const needsConfirm = suggestion.requiresConfirmation ||
      (suggestion.isSensitive && settings.askBeforeSensitiveFields);

    if (needsConfirm) {
      const confirmed = await showConfirmationDialog({
        fieldLabel: field.label || field.name || 'this field',
        profileKey: suggestion.profileKey,
        value: suggestion.value,
        confidence: suggestion.confidence,
        reason: suggestion.reason,
        isSensitive: suggestion.isSensitive,
      });
      if (!confirmed) continue;
    }

    await applyFill(field, suggestion.value, suggestion);
    onFilled?.(i, suggestion.value, suggestion);
  }
}
