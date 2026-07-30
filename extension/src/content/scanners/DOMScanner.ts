export interface ScannedField {
  element: HTMLElement;
  id: string;
  type: string;
  label: string;
  placeholder: string;
  isVisible: boolean;
}

export class DOMScanner {
  /**
   * Scans the document, including open shadow roots, for form fields.
   */
  scan(): ScannedField[] {
    const fields: ScannedField[] = [];
    this.traverse(document.body, fields);
    return fields;
  }

  /**
   * Recursively traverses nodes, pierces shadow DOMs, and collects inputs.
   */
  private traverse(node: Node, fields: ScannedField[]) {
    // Collect fields if this is an element
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      
      if (this.isFormField(el)) {
        fields.push(this.extractFieldData(el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement));
      }

      // If element has a shadow root, traverse it
      if (el.shadowRoot) {
        this.traverse(el.shadowRoot, fields);
      }
    }

    // Traverse children
    let child = node.firstChild;
    while (child) {
      this.traverse(child, fields);
      child = child.nextSibling;
    }
  }

  /**
   * Checks if an element is a target form field.
   */
  private isFormField(el: HTMLElement): boolean {
    const tagName = el.tagName.toLowerCase();
    const isInput = tagName === 'input';
    const isSelect = tagName === 'select';
    const isTextarea = tagName === 'textarea';
    
    if (!isInput && !isSelect && !isTextarea) return false;

    if (isInput) {
      const type = (el as HTMLInputElement).type.toLowerCase();
      const ignoreTypes = ['hidden', 'submit', 'button', 'image', 'reset', 'file'];
      if (ignoreTypes.includes(type)) return false;
    }

    return true;
  }

  /**
   * Extracts label and metadata for a given field element.
   */
  private extractFieldData(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): ScannedField {
    let label = '';
    
    // 1. Check for explicit <label for="id">
    if (el.id) {
      const labelEl = (el.getRootNode() as Document | ShadowRoot).querySelector(`label[for="${el.id}"]`);
      if (labelEl) label = labelEl.textContent?.trim() || '';
    }

    // 2. Check for implicit <label><input></label>
    if (!label) {
      const parentLabel = el.closest('label');
      if (parentLabel) label = parentLabel.textContent?.trim() || '';
    }

    // 3. Check aria-label
    if (!label) {
      label = el.getAttribute('aria-label') || '';
    }

    // 4. Fallback to placeholder or name
    if (!label) {
      label = el.getAttribute('placeholder') || el.getAttribute('name') || '';
    }

    // Clean up label by removing the input's own text if nested
    // (This is a simplified extraction; a robust one removes child text nodes)

    return {
      element: el,
      id: el.id || el.getAttribute('name') || crypto.randomUUID(),
      type: el.tagName.toLowerCase() === 'input' ? (el as HTMLInputElement).type : el.tagName.toLowerCase(),
      label,
      placeholder: el.getAttribute('placeholder') || '',
      isVisible: this.isVisible(el)
    };
  }

  /**
   * Simple visibility check.
   */
  private isVisible(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
  }
}

export const domScanner = new DOMScanner();
