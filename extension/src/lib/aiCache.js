/**
 * aiCache.js — Chrome storage-backed cache for AI field classification results.
 * Prevents redundant API calls for fields that have already been classified.
 */

import { STORAGE_KEYS } from '../shared/constants.js';

const CACHE_KEY = STORAGE_KEYS.AI_CACHE;
const MAX_CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Loads the full AI cache from chrome.storage.local.
 * @returns {Promise<object>} Map of fingerprint → { result, cachedAt }
 */
async function loadCache() {
  return new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (data) => {
      resolve(data[CACHE_KEY] || {});
    });
  });
}

/**
 * Saves the cache back to chrome.storage.local.
 * @param {object} cache
 */
async function saveCache(cache) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [CACHE_KEY]: cache }, resolve);
  });
}

/**
 * Gets a cached AI result for a field fingerprint.
 *
 * @param {string} fingerprint
 * @returns {Promise<object|null>} Cached result or null if not found/expired
 */
export async function getCached(fingerprint) {
  const cache = await loadCache();
  const entry = cache[fingerprint];
  if (!entry) return null;

  // Check TTL
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    // Expire the entry lazily
    delete cache[fingerprint];
    await saveCache(cache);
    return null;
  }

  return entry.result;
}

/**
 * Stores an AI result in the cache.
 *
 * @param {string} fingerprint
 * @param {object} result - { profileKey, confidence, reason }
 */
export async function setCached(fingerprint, result) {
  const cache = await loadCache();

  // Evict oldest entries if at capacity
  const keys = Object.keys(cache);
  if (keys.length >= MAX_CACHE_ENTRIES) {
    const sorted = keys.sort((a, b) => cache[a].cachedAt - cache[b].cachedAt);
    // Remove oldest 10%
    const toRemove = sorted.slice(0, Math.ceil(MAX_CACHE_ENTRIES * 0.1));
    for (const k of toRemove) delete cache[k];
  }

  cache[fingerprint] = { result, cachedAt: Date.now() };
  await saveCache(cache);
}

/**
 * Clears all cached AI results.
 */
export async function clearAICache() {
  await saveCache({});
}

/**
 * Returns cache statistics.
 * @returns {Promise<{ total: number, expired: number }>}
 */
export async function getCacheStats() {
  const cache = await loadCache();
  const now = Date.now();
  const expired = Object.values(cache).filter(e => now - e.cachedAt > CACHE_TTL_MS).length;
  return { total: Object.keys(cache).length, expired };
}
