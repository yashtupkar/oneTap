/**
 * SubmissionCapture.js — Intercepts form submissions and saves field values.
 *
 * Only reads values — never prevents submission or modifies forms.
 */

import { saveSubmission } from '../shared/api.js';
import { detectAllFields, getFieldLabel } from './FormDetector.js';
import { showToast } from './Toast.js';

/**
 * Collects the current values of all detected form fields.
 * @param {import('./FormDetector.js').FormField[]} fields
 * @returns {Array<{name, id, label, placeholder, type, value}>}
 */
export function collectFieldValues(fields) {
  return fields
    .filter(f => f.type !== 'file' && f.type !== 'submit' && f.type !== 'button')
    .map(f => ({
      name: f.name,
      id: f.id,
      label: f.label || getFieldLabel(f.element),
      placeholder: f.placeholder,
      type: f.type,
      value: f.element.value || '',
    }))
    .filter(f => f.value.trim() !== '');
}

/**
 * Attaches submit listeners to all forms on the page.
 * Saves a snapshot of form values on each submission.
 *
 * @param {import('./FormDetector.js').FormField[]} fields - All detected fields
 * @returns {{ disconnect: () => void }}
 */
export function captureFormSubmissions(fields) {
  const handlers = [];

  const handleSubmit = async (e) => {
    // DO NOT call e.preventDefault() — never block form submission
    const url = window.location.href;
    const domain = window.location.hostname;

    // Collect values at submission time (user may have changed them)
    const currentFields = detectAllFields();
    const fieldValues = collectFieldValues(currentFields.length > 0 ? currentFields : fields);

    if (fieldValues.length === 0) return;

    try {
      showToast('💾 OneTap: Saving new form data...', 'save', 3000);
      await saveSubmission(url, domain, fieldValues);
      console.log('[AI Autofill] Submission saved with', fieldValues.length, 'fields');
    } catch (err) {
      console.warn('[AI Autofill] Failed to save submission:', err.message);
    }
  };

  // Attach to all <form> elements
  const forms = document.querySelectorAll('form');
  for (const form of forms) {
    form.addEventListener('submit', handleSubmit);
    handlers.push({ form, handleSubmit });
  }

  // Watch for new forms
  const observer = new MutationObserver(() => {
    const currentForms = document.querySelectorAll('form');
    for (const form of currentForms) {
      if (!handlers.find(h => h.form === form)) {
        form.addEventListener('submit', handleSubmit);
        handlers.push({ form, handleSubmit });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return {
    disconnect: () => {
      observer.disconnect();
      handlers.forEach(({ form, handleSubmit }) =>
        form.removeEventListener('submit', handleSubmit)
      );
    },
  };
}
