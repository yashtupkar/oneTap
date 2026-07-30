import { ScannedField } from './DOMScanner';

export interface FieldFingerprint {
  id: string; // Random or static UUID for the field
  url: string;
  cssSelector: string;
  xPath: string;
  label: string;
  placeholder: string;
  type: string;
  neighbors: string[]; // Labels of previous and next fields
  sectionHeading: string;
}

export class Fingerprinter {
  /**
   * Generates a deep fingerprint for a scanned field to uniquely identify it.
   */
  generate(field: ScannedField, allFields: ScannedField[], index: number): FieldFingerprint {
    return {
      id: field.id,
      url: window.location.origin + window.location.pathname,
      cssSelector: this.generateCSSSelector(field.element),
      xPath: this.generateXPath(field.element),
      label: field.label,
      placeholder: field.placeholder,
      type: field.type,
      neighbors: this.getNeighbors(allFields, index),
      sectionHeading: this.getSectionHeading(field.element)
    };
  }

  /**
   * Extracts the general context of the current form.
   */
  getFormContext() {
    return {
      url: window.location.href,
      domain: window.location.hostname,
      formType: this.inferFormType(),
      step: this.inferStep(),
      progress: this.inferProgress()
    };
  }

  // --- Private Helpers ---

  private generateCSSSelector(el: HTMLElement): string {
    if (el.id) return `#${el.id}`;
    let path = [];
    let current: HTMLElement | null = el;
    while (current && current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() !== 'html') {
      let selector = current.tagName.toLowerCase();
      if (current.className && typeof current.className === 'string') {
        selector += '.' + current.className.trim().split(/\s+/).join('.');
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  private generateXPath(el: HTMLElement): string {
    if (el.id) return `//*[@id="${el.id}"]`;
    const parts = [];
    let current: HTMLElement | null = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let count = 0;
      let sibling = current.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && (sibling as HTMLElement).tagName === current.tagName) {
          count++;
        }
        sibling = sibling.previousSibling;
      }
      const index = count > 0 ? `[${count + 1}]` : '';
      parts.unshift(`${current.tagName.toLowerCase()}${index}`);
      current = current.parentElement;
    }
    return parts.length ? '/' + parts.join('/') : '';
  }

  private getNeighbors(allFields: ScannedField[], index: number): string[] {
    const neighbors = [];
    if (index > 0 && allFields[index - 1].label) {
      neighbors.push(allFields[index - 1].label);
    }
    if (index < allFields.length - 1 && allFields[index + 1].label) {
      neighbors.push(allFields[index + 1].label);
    }
    return neighbors;
  }

  private getSectionHeading(el: HTMLElement): string {
    // Looks for the nearest preceding h1, h2, h3
    let current: HTMLElement | null = el;
    while (current) {
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (['H1', 'H2', 'H3', 'H4'].includes(sibling.tagName)) {
          return sibling.textContent?.trim() || '';
        }
        sibling = sibling.previousElementSibling;
      }
      current = current.parentElement;
    }
    return '';
  }

  private inferFormType(): string {
    const text = document.body.innerText.toLowerCase();
    if (text.includes('checkout') || text.includes('shipping')) return 'Checkout';
    if (text.includes('application') || text.includes('resume')) return 'Job Application';
    if (text.includes('register') || text.includes('sign up')) return 'Registration';
    return 'General Form';
  }

  private inferStep(): string {
    // Simple heuristic: looks for active step in a stepper
    const activeStep = document.querySelector('.active-step, [aria-current="step"]');
    return activeStep?.textContent?.trim() || '1';
  }

  private inferProgress(): string {
    const progressBar = document.querySelector('progress, [role="progressbar"]');
    if (progressBar) {
      return progressBar.getAttribute('aria-valuenow') || 'unknown';
    }
    return 'unknown';
  }
}

export const fingerprinter = new Fingerprinter();
