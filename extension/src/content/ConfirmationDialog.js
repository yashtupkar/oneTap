/**
 * ConfirmationDialog.js — Shows a styled confirmation dialog before filling
 * sensitive fields or uploading files.
 */

/**
 * Creates and shows a confirmation dialog.
 *
 * @param {object} options
 * @param {string} options.fieldLabel
 * @param {string} options.profileKey
 * @param {string} options.value - Value to be filled (masked for sensitive fields)
 * @param {number} options.confidence
 * @param {string} options.reason
 * @param {boolean} options.isSensitive
 * @returns {Promise<boolean>} true if confirmed, false if rejected
 */
export function showConfirmationDialog({ fieldLabel, profileKey, value, confidence, reason, isSensitive }) {
  return new Promise((resolve) => {
    // Remove any existing dialog
    const existing = document.getElementById('ai-autofill-confirm-dialog');
    if (existing) existing.remove();

    const displayValue = isSensitive
      ? value.slice(0, 2) + '•'.repeat(Math.max(0, value.length - 4)) + value.slice(-2)
      : value;

    const dialog = document.createElement('div');
    dialog.id = 'ai-autofill-confirm-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Autofill Confirmation');

    dialog.innerHTML = `
      <div class="ai-af-overlay" id="ai-af-overlay">
        <div class="ai-af-dialog">
          <div class="ai-af-dialog-header">
            <span class="ai-af-dialog-icon">${isSensitive ? '🔒' : '💡'}</span>
            <h3 class="ai-af-dialog-title">Confirm Autofill</h3>
          </div>
          <div class="ai-af-dialog-body">
            <p class="ai-af-dialog-field">Fill <strong>${escapeHtml(fieldLabel)}</strong>?</p>
            <div class="ai-af-dialog-value">
              <span class="ai-af-dialog-value-label">Value:</span>
              <span class="ai-af-dialog-value-text ${isSensitive ? 'ai-af-masked' : ''}">${escapeHtml(displayValue)}</span>
            </div>
            <div class="ai-af-dialog-confidence">
              <div class="ai-af-conf-bar-bg">
                <div class="ai-af-conf-bar" style="width:${Math.round(confidence * 100)}%"></div>
              </div>
              <span class="ai-af-conf-pct">${Math.round(confidence * 100)}% confident</span>
            </div>
            <p class="ai-af-dialog-reason">${escapeHtml(reason)}</p>
          </div>
          <div class="ai-af-dialog-actions">
            <button id="ai-af-deny" class="ai-af-btn ai-af-btn-deny">Skip</button>
            <button id="ai-af-confirm" class="ai-af-btn ai-af-btn-confirm">Fill it</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const cleanup = (result) => {
      dialog.remove();
      resolve(result);
    };

    document.getElementById('ai-af-confirm').addEventListener('click', () => cleanup(true));
    document.getElementById('ai-af-deny').addEventListener('click', () => cleanup(false));
    document.getElementById('ai-af-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) cleanup(false);
    });

    // Keyboard: Enter = confirm, Escape = deny
    const keyHandler = (e) => {
      if (e.key === 'Enter') { document.removeEventListener('keydown', keyHandler); cleanup(true); }
      if (e.key === 'Escape') { document.removeEventListener('keydown', keyHandler); cleanup(false); }
    };
    document.addEventListener('keydown', keyHandler);

    // Focus the confirm button
    requestAnimationFrame(() => document.getElementById('ai-af-confirm')?.focus());
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
