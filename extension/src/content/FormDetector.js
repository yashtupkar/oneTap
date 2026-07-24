/**
 * FormDetector.js — Scans the DOM for all form-related fields.
 * Handles standard inputs, textareas, selects, radios, checkboxes, and file inputs.
 * Watches for dynamically injected fields via MutationObserver.
 */

/**
 * @typedef {Object} FormField
 * @property {HTMLElement} element - The actual DOM element
 * @property {string} name
 * @property {string} id
 * @property {string} label
 * @property {string} placeholder
 * @property {string} type - 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | etc.
 * @property {string} value - Current value
 * @property {string} [accept] - For file inputs, the accept attribute
 * @property {string[]} [options] - For select/radio, the available options
 * @property {string} fingerprint - SHA-256-like unique fingerprint
 */

const IGNORED_TYPES = new Set(['submit', 'button', 'reset', 'image', 'hidden']);
const IGNORED_ROLES = new Set(['button', 'menuitem', 'tab', 'link']);

/**
 * Generates a simple fingerprint for a field (no crypto needed in content scripts).
 * @param {HTMLElement} el
 * @returns {string}
 */
function fingerprintField(el) {
  const parts = [
    (el.name || '').toLowerCase(),
    (el.id || '').toLowerCase(),
    getFieldLabel(el).toLowerCase(),
    (el.type || 'text').toLowerCase(),
  ].join('|');
  // Simple hash (not crypto, just for dedup)
  let hash = 0;
  for (let i = 0; i < parts.length; i++) {
    hash = (hash << 5) - hash + parts.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Finds the label text for a form element.
 * Checks: <label for="">, aria-label, aria-labelledby, parent <label>, title, data-label.
 *
 * @param {HTMLElement} el
 * @returns {string}
 */
export function getFieldLabel(el) {
  // aria-label
  if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');

  // aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) return labelEl.textContent?.trim() || '';
  }

  // <label for="id">
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label) return label.textContent?.trim() || '';
  }

  // Parent <label>
  const parentLabel = el.closest('label');
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true);
    clone.querySelectorAll('input, select, textarea').forEach(c => c.remove());
    const text = clone.textContent?.trim();
    if (text) return text;
  }

  // Previous sibling text / label-like element
  const prev = el.previousElementSibling;
  if (prev && ['LABEL', 'SPAN', 'DIV', 'P'].includes(prev.tagName)) {
    const text = prev.textContent?.trim();
    if (text && text.length < 100) return text;
  }

  // title attribute
  if (el.title) return el.title;

  // data-label
  if (el.dataset.label) return el.dataset.label;

  return '';
}

/**
 * Collects select options as an array of strings.
 * @param {HTMLSelectElement} select
 * @returns {string[]}
 */
function getSelectOptions(select) {
  return Array.from(select.options).map(o => o.text.trim()).filter(Boolean);
}

/**
 * Builds a FormField descriptor from a DOM element.
 * @param {HTMLElement} el
 * @returns {FormField|null}
 */
export function buildFieldDescriptor(el) {
  const tag = el.tagName.toLowerCase();
  const type = (el.type || (tag === 'select' ? 'select' : 'textarea')).toLowerCase();

  if (IGNORED_TYPES.has(type)) return null;
  if (IGNORED_ROLES.has(el.getAttribute('role') || '')) return null;
  if (el.disabled || el.readOnly) return null;

  const label = getFieldLabel(el);

  /** @type {FormField} */
  const field = {
    element: el,
    name: el.name || '',
    id: el.id || '',
    label,
    placeholder: el.placeholder || '',
    type,
    value: el.value || '',
    fingerprint: fingerprintField(el),
  };

  if (type === 'file') {
    field.accept = el.accept || '';
  }

  if (tag === 'select') {
    field.options = getSelectOptions(el);
  }

  if (type === 'radio' || type === 'checkbox') {
    field.checked = el.checked;
    field.groupName = el.name;
  }

  return field;
}

/**
 * Scans the entire document for fillable form fields.
 * @returns {FormField[]}
 */
export function detectAllFields() {
  const elements = document.querySelectorAll(
    'input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="image"]), textarea, select'
  );

  const fields = [];
  const seen = new Set();

  for (const el of elements) {
    if (!el.offsetParent && el.type !== 'hidden') continue; // Skip invisible elements
    const descriptor = buildFieldDescriptor(el);
    if (!descriptor) continue;
    if (seen.has(descriptor.fingerprint)) continue; // Dedup
    seen.add(descriptor.fingerprint);
    fields.push(descriptor);
  }

  return fields;
}

/**
 * Watches for dynamically added form fields using MutationObserver.
 *
 * @param {(newFields: FormField[]) => void} onNewFields - Callback with newly detected fields
 * @returns {{ disconnect: () => void }}
 */
export function watchForNewFields(onNewFields) {
  let debounceTimer = null;
  const knownFingerprints = new Set(detectAllFields().map(f => f.fingerprint));

  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentFields = detectAllFields();
      const newFields = currentFields.filter(f => !knownFingerprints.has(f.fingerprint));
      if (newFields.length > 0) {
        for (const f of newFields) knownFingerprints.add(f.fingerprint);
        onNewFields(newFields);
      }
    }, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['name', 'id', 'type', 'aria-label'],
  });

  return { disconnect: () => observer.disconnect() };
}
