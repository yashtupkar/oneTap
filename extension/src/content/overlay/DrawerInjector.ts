/**
 * DrawerInjector
 * 
 * This module is responsible for providing a fallback UI for browsers that 
 * do not support the Native Chrome Side Panel API (e.g. Firefox, Safari).
 * It injects an iframe containing the Side Panel React app as a floating right drawer.
 */

export class DrawerInjector {
  private drawerElement: HTMLIFrameElement | null = null;
  private isVisible: boolean = false;

  /**
   * Initializes the fallback drawer.
   */
  init() {
    // Only inject if chrome.sidePanel API is not available
    // or if explicitly configured via an environment flag
    if ('sidePanel' in chrome) {
      console.log('[DrawerInjector] Native Side Panel available. Skipping fallback injection.');
      return;
    }

    this.injectIframe();
    this.listenForToggle();
  }

  private injectIframe() {
    if (this.drawerElement) return;

    this.drawerElement = document.createElement('iframe');
    // Point the iframe to the sidepanel/index.html that the React app uses
    this.drawerElement.src = chrome.runtime.getURL('sidepanel/index.html');
    
    // Style as a fixed right-side drawer
    this.drawerElement.style.position = 'fixed';
    this.drawerElement.style.top = '0';
    this.drawerElement.style.right = '-400px'; // Hidden by default
    this.drawerElement.style.width = '400px';
    this.drawerElement.style.height = '100vh';
    this.drawerElement.style.zIndex = '2147483647';
    this.drawerElement.style.border = 'none';
    this.drawerElement.style.borderLeft = '1px solid #e2e8f0';
    this.drawerElement.style.boxShadow = '-4px 0 15px rgba(0,0,0,0.1)';
    this.drawerElement.style.transition = 'right 0.3s ease-in-out';
    this.drawerElement.style.backgroundColor = 'white';

    document.documentElement.appendChild(this.drawerElement);
  }

  private listenForToggle() {
    // Listen for messages from the background worker or content script
    // to open/close the drawer (e.g., when the extension icon is clicked in Firefox)
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TOGGLE_FALLBACK_DRAWER') {
        this.toggle();
      }
    });
  }

  toggle() {
    this.isVisible = !this.isVisible;
    if (this.drawerElement) {
      this.drawerElement.style.right = this.isVisible ? '0px' : '-400px';
    }
  }
}

export const drawerInjector = new DrawerInjector();
