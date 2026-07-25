const fetch = require('node-fetch');
const { logger } = require('../utils/logger');

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL;

// In-memory cache keyed by field fingerprint to avoid duplicate API calls in same process
const inMemoryCache = new Map();

/** Known profile keys for the AI to choose from */
const VALID_PROFILE_KEYS = [
  'firstName', 'middleName', 'lastName', 'fullName', 'dateOfBirth', 'gender', 'nationality',
  'email', 'phone', 'alternatePhone', 'linkedIn', 'website', 'github',
  'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country',
  'currentJobTitle', 'currentCompany', 'yearsOfExperience', 'skills',
  'summary', 'expectedSalary', 'noticePeriod',
  'highestDegree', 'fieldOfStudy', 'university', 'graduationYear',
  'passportNumber', 'panNumber', 'aadhaarNumber', 'drivingLicenseNumber',
  'none',
];

/**
 * Calls the OpenRouter API to classify a form field to a profile key.
 *
 * @param {object} fieldDescriptor - { name, id, label, placeholder, type }
 * @param {string} apiKey - OpenRouter API key
 * @param {string} [fingerprint] - Cache key (optional)
 * @param {string[]} [customKeys] - Additional custom keys (optional)
 * @returns {Promise<{ profileKey: string | null, confidence: number, reason: string }>}
 */
async function classifyField(fieldDescriptor, apiKey, fingerprint, customKeys = []) {
  // Check in-memory cache first
  if (fingerprint && inMemoryCache.has(fingerprint)) {
    logger.debug(`AI cache hit for fingerprint: ${fingerprint.slice(0, 8)}...`);
    return { ...inMemoryCache.get(fingerprint), fromCache: true };
  }

  const prompt = buildPrompt(fieldDescriptor, customKeys);
  const key = apiKey || process.env.OPENROUTER_API_KEY;

  if (!key) {
    logger.warn('No OpenRouter API key provided — skipping AI classification');
    return { profileKey: null, confidence: 0, reason: 'No API key configured' };
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': '',
        'X-Title': '',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const result = parseAIResponse(content, customKeys);

    // Cache the result in memory
    if (fingerprint) {
      inMemoryCache.set(fingerprint, result);
    }

    logger.debug(`AI classified field "${fieldDescriptor.label || fieldDescriptor.name}" → ${result.profileKey} (${result.confidence})`);
    return result;

  } catch (err) {
    logger.error(`AI classification error: ${err.message}\\n${err.stack}`);
    return { profileKey: null, confidence: 0, reason: `AI error: ${err.message}` };
  }
}

/**
 * Builds the user prompt for AI field classification.
 */
function buildPrompt(field, customKeys = []) {
  const allKeys = [...VALID_PROFILE_KEYS, ...customKeys];
  return `Classify this HTML form field to a profile key.

Field details:
- name attribute: "${field.name || ''}"
- id attribute: "${field.id || ''}"
- label text: "${field.label || ''}"
- placeholder: "${field.placeholder || ''}"
- input type: "${field.type || 'text'}"

Valid profile keys:
${allKeys.map(k => `- ${k}`).join('\n')}

Respond ONLY with valid JSON in this exact format:
{"profileKey": "keyName", "confidence": 0.9, "reason": "brief explanation"}

Use "none" as profileKey if you cannot match it. Confidence should be 0-1.`;
}

const SYSTEM_PROMPT = `You are a form field classifier for an autofill extension. 
Your job is to map HTML form fields to structured user profile keys.
Always respond with valid JSON only. No markdown, no explanation outside JSON.
Be conservative — use "none" if unsure. Never guess at sensitive fields like passport or PAN unless very clear.
CRITICAL: Do NOT map 'Customer Service' or support text to Credit Card fields. Only map actual Credit Card number fields to creditCardNumber.`;

/**
 * Parses the AI JSON response.
 */
function parseAIResponse(content, customKeys = []) {
  try {
    // Strip any markdown code fences
    const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const allKeys = [...VALID_PROFILE_KEYS, ...customKeys];
    const profileKey = allKeys.includes(parsed.profileKey)
      ? (parsed.profileKey === 'none' ? null : parsed.profileKey)
      : null;
    return {
      profileKey,
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0)),
      reason: parsed.reason || 'AI classified',
    };
  } catch (err) {
    const { logger } = require('../utils/logger');
    logger.error(`AI parse error: ${err.message}\\nRaw content was: ${content}`);
    return { profileKey: null, confidence: 0, reason: 'AI returned invalid JSON' };
  }
}

/** Clears the in-memory cache (useful for testing) */
function clearCache() {
  inMemoryCache.clear();
}

module.exports = { classifyField, clearCache };
