import { domScanner } from '../scanners/DOMScanner';
import { fingerprinter } from '../scanners/Fingerprinter';

const DRAFT_KEY = 'oneTap_draft_recovery';

export class DraftRecovery {
  private intervalId: number | null = null;

  /**
   * Starts periodically saving the state of the current form.
   */
  startWatching() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.saveState();
    }, 3000); // Save every 3 seconds

    // Also try to recover on load
    this.checkRecovery();
  }

  stopWatching() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Serializes the current values of all detected fields.
   */
  private saveState() {
    const fields = domScanner.scan();
    if (fields.length === 0) return;

    const state: Record<string, string> = {};
    let hasValues = false;

    fields.forEach((field, index) => {
      const el = field.element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (el.value && el.value.trim() !== '') {
        const fp = fingerprinter.generate(field, fields, index);
        state[fp.id] = el.value;
        hasValues = true;
      }
    });

    if (hasValues) {
      const payload = {
        url: window.location.href,
        timestamp: Date.now(),
        values: state
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    }
  }

  /**
   * Checks if there's a recent draft for the current URL.
   */
  private checkRecovery() {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      const isSameUrl = payload.url === window.location.href;
      const isRecent = (Date.now() - payload.timestamp) < (24 * 60 * 60 * 1000); // 24 hours

      if (isSameUrl && isRecent && Object.keys(payload.values).length > 0) {
        // Trigger UI prompt for recovery
        console.log('[DraftRecovery] Draft found. Triggering recovery prompt.');
        // EventBus.send('SHOW_RECOVERY_PROMPT', payload.values);
      }
    } catch (err) {
      console.error('[DraftRecovery] Failed to parse draft state', err);
    }
  }

  /**
   * Applies the saved draft state back to the DOM.
   */
  applyState(values: Record<string, string>) {
    const fields = domScanner.scan();
    fields.forEach((field, index) => {
      const fp = fingerprinter.generate(field, fields, index);
      if (values[fp.id]) {
        const el = field.element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        el.value = values[fp.id];
        // Dispatch synthetic events to trigger frontend frameworks (React/Vue)
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    sessionStorage.removeItem(DRAFT_KEY);
  }
}

export const draftRecovery = new DraftRecovery();
