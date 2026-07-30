import { domScanner } from '../scanners/DOMScanner';
import { EventBus } from '../../core/EventBus';
import { fingerprinter } from '../scanners/Fingerprinter';

export class DOMObserver {
  private observer: MutationObserver | null = null;
  private debounceTimer: number | null = null;
  private isProcessing = false;
  
  // Cache to prevent re-analyzing the exact same DOM structure
  private lastHash = '';

  /**
   * Starts observing the DOM for structural changes (nodes added/removed).
   */
  start() {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      // Fast exit if we only see text changes or irrelevant attribute changes
      const hasSignificantChanges = mutations.some(m => 
        m.type === 'childList' || 
        (m.type === 'attributes' && ['style', 'class', 'type', 'disabled'].includes(m.attributeName || ''))
      );

      if (hasSignificantChanges) {
        this.scheduleScan();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'type', 'disabled']
    });

    // Initial scan
    this.scheduleScan();
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Debounces the actual DOM scan to prevent performance degradation on SPAs.
   */
  private scheduleScan() {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.performScan();
    }, 500); // 500ms debounce
  }

  /**
   * Scans the DOM and notifies the background worker if new forms are found.
   */
  private async performScan() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const fields = domScanner.scan();
      
      if (fields.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Generate a lightweight hash of the form structure
      const currentHash = fields.map(f => f.id + f.type).join('|');
      
      // If the structure hasn't changed, don't ping the background worker again
      if (currentHash === this.lastHash) {
        this.isProcessing = false;
        return;
      }
      this.lastHash = currentHash;

      console.log(`[DOMObserver] Found ${fields.length} fields. Updating context...`);
      
      // Notify the system that a form is active
      const context = fingerprinter.getFormContext();
      
      EventBus.send('FORM_DETECTED', {
        ...context,
        fieldsCount: fields.length,
        // In reality, we'd also send the fingerprints here for batch AI processing
      }).catch(console.error);

    } finally {
      this.isProcessing = false;
    }
  }
}

export const domObserver = new DOMObserver();
