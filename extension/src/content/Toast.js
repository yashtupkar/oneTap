/**
 * Toast.js - Simple utility to show non-blocking notifications.
 */

export function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('ai-autofill-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ai-autofill-toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `ai-af-toast ai-af-toast-${type}`;
  
  const icon = type === 'success' ? '✨' : type === 'save' ? '💾' : 'ℹ️';
  
  toast.innerHTML = `
    <span class="ai-af-toast-icon">${icon}</span>
    <span class="ai-af-toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger reflow to ensure animation works
  void toast.offsetWidth;
  toast.classList.add('ai-af-toast-visible');

  setTimeout(() => {
    toast.classList.remove('ai-af-toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}
