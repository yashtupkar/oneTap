/**
 * api.js — Typed API client for communicating with the backend server.
 * All calls go through the background service worker via chrome.runtime.sendMessage.
 */

import { MSG } from './constants.js';

/**
 * Sends a message to the background service worker.
 * @param {string} type - Message type from MSG constants
 * @param {object} payload - Message payload
 * @returns {Promise<any>}
 */
async function sendToBackground(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response);
    });
  });
}

// ── API Methods ───────────────────────────────────────────────────────────────

/** Fetch autofill suggestions for a list of field descriptors */
export async function fetchSuggestions(fields, domain) {
  return sendToBackground(MSG.FETCH_SUGGESTIONS, { fields, domain });
}

/** Save a form submission to the backend */
export async function saveSubmission(url, domain, fields) {
  return sendToBackground(MSG.SAVE_SUBMISSION, { url, domain, fields });
}

/** Record a user correction for a field mapping */
export async function recordCorrection(fieldDescriptor, oldProfileKey, newProfileKey, domain) {
  return sendToBackground(MSG.RECORD_CORRECTION, {
    fieldDescriptor, oldProfileKey, newProfileKey, domain,
  });
}

/** Get the current user profile */
export async function getProfile() {
  return sendToBackground(MSG.GET_PROFILE);
}

/** Update the user profile */
export async function updateProfile(profileData) {
  return sendToBackground(MSG.UPDATE_PROFILE, { profileData });
}

/** Get current extension settings */
export async function getSettings() {
  const res = await sendToBackground(MSG.GET_SETTINGS);
  return res.settings || res;
}

/** Update extension settings */
export async function updateSettings(settings) {
  return sendToBackground(MSG.UPDATE_SETTINGS, { settings });
}

export async function getDeviceId() {
  return sendToBackground(MSG.GET_DEVICE_ID);
}

/** Get the auth token */
export async function getToken() {
  return sendToBackground(MSG.GET_TOKEN);
}

/** Login */
export async function login(email, password) {
  return sendToBackground(MSG.LOGIN, { email, password });
}

/** Register */
export async function register(email, password, deviceId) {
  return sendToBackground(MSG.REGISTER, { email, password, deviceId });
}

/** Logout */
export async function logout() {
  return sendToBackground(MSG.LOGOUT);
}

/** Ask the AI assistant about selected text */
export async function askAiAssistant(prompt, selectedText) {
  return sendToBackground(MSG.ASK_AI_ASSISTANT, { prompt, selectedText });
}

// ── Direct API calls (used from background service worker) ────────────────────

/**
 * Makes a direct fetch call to the backend API.
 * Used only from the background service worker.
 *
 * @param {string} path - API path (e.g., '/autofill/suggest')
 * @param {object} options - fetch options
 * @param {string} serverUrl - Backend server URL
 * @param {string} deviceId - Device ID for auth
 * @param {string} token - Auth token
 * @returns {Promise<any>}
 */
export async function apiRequest(path, options = {}, serverUrl, deviceId, token = null) {
  const url = `${serverUrl}/api${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Device-ID': deviceId,
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
