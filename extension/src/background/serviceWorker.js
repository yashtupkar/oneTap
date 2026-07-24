/**
 * serviceWorker.js — Chrome Extension MV3 Background Service Worker
 *
 * Acts as the central message router between content scripts and the backend API.
 * Manages device ID, settings, and proxies all API calls.
 */

import { MSG, DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/constants.js';
import { apiRequest } from '../shared/api.js';
import { getCached, setCached } from '../lib/aiCache.js';

// ── Initialization ────────────────────────────────────────────────────────────

/**
 * Gets or creates the persistent device ID.
 * @returns {Promise<string>}
 */
async function getOrCreateDeviceId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEYS.DEVICE_ID, async (data) => {
      if (data[STORAGE_KEYS.DEVICE_ID]) {
        resolve(data[STORAGE_KEYS.DEVICE_ID]);
        return;
      }
      // Generate a new UUID-like device ID
      const id = crypto.randomUUID();
      chrome.storage.local.set({ [STORAGE_KEYS.DEVICE_ID]: id }, () => resolve(id));
    });
  });
}

/**
 * Gets the current user settings, merged with defaults.
 * @returns {Promise<object>}
 */
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEYS.SETTINGS, (data) => {
      resolve({ ...DEFAULT_SETTINGS, ...(data[STORAGE_KEYS.SETTINGS] || {}) });
    });
  });
}

/**
 * Saves settings to chrome.storage.local.
 * @param {object} settings
 */
async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings }, resolve);
  });
}

// ── Message Handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message asynchronously
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message || 'Unknown error' }));

  // Return true to keep the message channel open for async response
  return true;
});

/**
 * Routes incoming messages to the appropriate handler.
 */
async function handleMessage(message, sender) {
  const { type } = message;
  const settings = await getSettings();
  const deviceId = await getOrCreateDeviceId();
  const serverUrl = settings.serverUrl || 'http://localhost:3001';

  switch (type) {
    case MSG.GET_DEVICE_ID:
      return { deviceId };

    case MSG.GET_SETTINGS:
      return { settings };

    case MSG.UPDATE_SETTINGS: {
      const merged = { ...settings, ...message.settings };
      await saveSettings(merged);
      return { settings: merged };
    }

    case MSG.FETCH_SUGGESTIONS: {
      const { fields, domain } = message;
      // Check if autofill is enabled
      if (!settings.enabled) {
        return { suggestions: [], disabled: true };
      }
      try {
        const response = await apiRequest(
          '/autofill/suggest',
          {
            method: 'POST',
            body: JSON.stringify({
              fields,
              domain,
              openrouterApiKey: settings.openrouterApiKey,
            }),
          },
          serverUrl,
          deviceId
        );
        return response;
      } catch (err) {
        console.error('[AI Autofill] Suggest failed:', err.message);
        return { suggestions: [], error: err.message };
      }
    }

    case MSG.SAVE_SUBMISSION: {
      const { url, domain, fields } = message;
      try {
        return await apiRequest(
          '/submissions',
          { method: 'POST', body: JSON.stringify({ url, domain, fields }) },
          serverUrl,
          deviceId
        );
      } catch (err) {
        console.error('[AI Autofill] Submission save failed:', err.message);
        return { error: err.message };
      }
    }

    case MSG.RECORD_CORRECTION: {
      const { fieldDescriptor, oldProfileKey, newProfileKey, domain } = message;
      try {
        return await apiRequest(
          '/autofill/correct',
          {
            method: 'POST',
            body: JSON.stringify({ fieldDescriptor, oldProfileKey, newProfileKey, domain }),
          },
          serverUrl,
          deviceId
        );
      } catch (err) {
        console.error('[AI Autofill] Correction failed:', err.message);
        return { error: err.message };
      }
    }

    case MSG.GET_PROFILE: {
      try {
        return await apiRequest('/profile', {}, serverUrl, deviceId);
      } catch (err) {
        return { error: err.message };
      }
    }

    case MSG.UPDATE_PROFILE: {
      try {
        return await apiRequest(
          '/profile',
          { method: 'PATCH', body: JSON.stringify(message.profileData) },
          serverUrl,
          deviceId
        );
      } catch (err) {
        return { error: err.message };
      }
    }

    default:
      return { error: `Unknown message type: ${type}` };
  }
}

// ── Extension Install / Update ────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize default settings
    const settings = await getSettings();
    await saveSettings(settings);

    // Generate device ID on first install
    await getOrCreateDeviceId();

    console.log('[AI Autofill] Extension installed successfully');

    // Open options page on first install
    chrome.tabs.create({ url: chrome.runtime.getURL('options/index.html') });
  }
});

// ── Context Menu ──────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'openOptions',
    title: 'AI Form Autofill Settings',
    contexts: ['action'],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'openOptions') {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/index.html') });
  }
});
