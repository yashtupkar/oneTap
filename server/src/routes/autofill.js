const express = require('express');
const { requireAuth } = require('../middleware/auth');
const UserProfile = require('../models/UserProfile');
const Document = require('../models/Document');
const FieldMapping = require('../models/FieldMapping');
const {
  matchFields,
  matchFileInputToCategory,
  computeFieldFingerprint,
  SENSITIVE_KEYS,
} = require('../services/matchingService');
const { classifyField } = require('../services/aiService');
const { decryptProfileSensitiveFields } = require('../services/encryptionService');
const { logger } = require('../utils/logger');

const router = express.Router();
router.use(requireAuth);

// Confidence thresholds
const RULE_CONFIDENCE_THRESHOLD = 0.8;   // Fill without asking
const AI_FALLBACK_THRESHOLD = 0.4;        // Minimum rule confidence to skip AI
const SENSITIVE_THRESHOLD = 0.95;         // Fill sensitive fields without asking

/**
 * POST /api/autofill/suggest
 * Given a list of field descriptors, return fill suggestions.
 *
 * Body: {
 *   fields: [{ name, id, label, placeholder, type, accept? }],
 *   domain: string,
 *   openrouterApiKey?: string  (user-provided key from extension options)
 * }
 */
router.post('/suggest', async (req, res, next) => {
  try {
    const { fields, domain, openrouterApiKey } = req.body;

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'fields array is required' });
    }

    // Load user profile (decrypted)
    const profileDoc = await UserProfile.findOne({ deviceId: req.deviceId });
    const profile = profileDoc ? decryptProfileSensitiveFields(profileDoc) : {};

    // Load documents for file input matching
    const documents = await Document.find({ deviceId: req.deviceId });

    // Load existing learned mappings for this device
    const fingerprints = fields.map(f => computeFieldFingerprint(f));
    const learnedMappings = await FieldMapping.find({
      deviceId: req.deviceId,
      fieldFingerprint: { $in: fingerprints },
    });
    const learnedMap = new Map(learnedMappings.map(m => [m.fieldFingerprint, m]));

    // ── Step 1: Rule-based matching ──────────────────────────────────────────
    const ruleMatches = matchFields(fields);

    // ── Step 2: Build suggestions ────────────────────────────────────────────
    const suggestions = await Promise.all(
      fields.map(async (field, idx) => {
        const fingerprint = fingerprints[idx];
        const ruleMatch = ruleMatches[idx];

        // Handle file inputs
        if (field.type === 'file') {
          return buildFileInputSuggestion(field, documents);
        }

        // Check custom fields first
        let customKey = field.name || field.id;
        if (!customKey && field.label) {
          customKey = field.label.toLowerCase().trim().replace(/[\s\W]+/g, '_');
        }
        if (customKey && profile.customFields && profile.customFields[customKey]) {
          const cf = profile.customFields[customKey];
          const value = typeof cf === 'object' ? cf.value : cf;
          const isSensitive = typeof cf === 'object' ? !!cf.sensitive : false;

          return buildSuggestion({
            field,
            profileKey: `customFields.${customKey}`,
            value: value,
            confidence: 0.9,
            source: 'custom_field',
            reason: `Matched custom field "${customKey}"`,
            isSensitive,
            requiresConfirmation: isSensitive
          });
        }

        // Check learned mappings first (user-confirmed = highest priority)
        const learned = learnedMap.get(fingerprint);
        if (learned && learned.confidence >= RULE_CONFIDENCE_THRESHOLD) {
          const value = profile[learned.profileKey];
          return buildSuggestion({
            field,
            profileKey: learned.profileKey,
            value: value || null,
            confidence: learned.confidence,
            source: 'learned',
            reason: `Previously learned mapping (${learned.confirmations} confirmations)`,
          });
        }

        // Use rule match if confidence is high enough
        let profileKey = ruleMatch.profileKey;
        let confidence = ruleMatch.confidence;
        let source = 'rule';
        let reason = `Rule-based match on field "${field.label || field.name}"`;

        // Fall back to AI if rule confidence is low
        if (confidence < AI_FALLBACK_THRESHOLD && !ruleMatch.profileKey) {
          const apiKey = openrouterApiKey || process.env.OPENROUTER_API_KEY;
          if (apiKey) {
            logger.debug(`Falling back to AI for field: ${field.label || field.name}`);
            const aiResult = await classifyField(field, apiKey, fingerprint);
            if (aiResult.profileKey && aiResult.confidence > confidence) {
              profileKey = aiResult.profileKey;
              confidence = aiResult.confidence;
              source = aiResult.fromCache ? 'ai_cache' : 'ai';
              reason = aiResult.reason;
            }
          }
        }

        if (!profileKey) {
          return buildSuggestion({ field, profileKey: null, value: null, confidence: 0, source, reason: 'No matching profile key found' });
        }

        const value = profile[profileKey];
        const isSensitive = SENSITIVE_KEYS.has(profileKey);
        const requiresConfirmation = isSensitive
          ? confidence < SENSITIVE_THRESHOLD
          : confidence < RULE_CONFIDENCE_THRESHOLD;

        return buildSuggestion({ field, profileKey, value: value || null, confidence, source, reason, isSensitive, requiresConfirmation });
      })
    );

    res.json({ success: true, suggestions });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/autofill/correct
 * Records a user correction to improve future matching.
 *
 * Body: { fieldDescriptor, oldProfileKey, newProfileKey, domain }
 */
router.post('/correct', async (req, res, next) => {
  try {
    const { fieldDescriptor, oldProfileKey, newProfileKey, domain } = req.body;
    if (!fieldDescriptor || !newProfileKey) {
      return res.status(400).json({ error: 'fieldDescriptor and newProfileKey are required' });
    }

    const fingerprint = computeFieldFingerprint(fieldDescriptor);

    // Update or create the mapping with user correction
    const existing = await FieldMapping.findOne({ deviceId: req.deviceId, fieldFingerprint: fingerprint });

    if (existing) {
      // Boost confidence for the new key, penalize if it was a correction
      const wasCorrection = existing.profileKey !== newProfileKey;
      await FieldMapping.findOneAndUpdate(
        { deviceId: req.deviceId, fieldFingerprint: fingerprint },
        {
          $set: {
            profileKey: newProfileKey,
            source: 'user',
            confidence: 0.95,  // User-corrected mappings get high confidence
            lastUsedAt: new Date(),
            domain,
          },
          $inc: {
            corrections: wasCorrection ? 1 : 0,
            confirmations: wasCorrection ? 0 : 1,
          },
        }
      );
    } else {
      await FieldMapping.create({
        deviceId: req.deviceId,
        fieldFingerprint: fingerprint,
        fieldDescriptor,
        profileKey: newProfileKey,
        confidence: 0.95,
        source: 'user',
        domain,
        confirmations: 1,
      });
    }

    res.json({ success: true, message: 'Correction recorded' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/autofill/mappings
 * Returns all learned field mappings for this device.
 */
router.get('/mappings', async (req, res, next) => {
  try {
    const mappings = await FieldMapping.find({ deviceId: req.deviceId })
      .sort({ lastUsedAt: -1 })
      .limit(200);
    res.json({ success: true, mappings });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/autofill/mappings/:id
 * Removes a learned mapping.
 */
router.delete('/mappings/:id', async (req, res, next) => {
  try {
    await FieldMapping.deleteOne({ _id: req.params.id, deviceId: req.deviceId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSuggestion({ field, profileKey, value, confidence, source, reason, isSensitive = false, requiresConfirmation = false }) {
  const status = !profileKey ? 'missing' : !value ? 'missing' : confidence >= 0.8 ? 'filled' : 'suggested';
  return {
    fieldName: field.name,
    fieldId: field.id,
    fieldType: field.type,
    profileKey,
    value,
    confidence: Math.round(confidence * 100) / 100,
    status,
    source,
    reason,
    isSensitive,
    requiresConfirmation: requiresConfirmation || (isSensitive && confidence < SENSITIVE_THRESHOLD),
    isFileInput: false,
  };
}

function buildFileInputSuggestion(field, documents) {
  const { category, confidence } = matchFileInputToCategory(field);
  if (!category) {
    return {
      fieldName: field.name,
      fieldId: field.id,
      fieldType: 'file',
      profileKey: null,
      documentCategory: null,
      document: null,
      confidence: 0,
      status: 'missing',
      source: 'rule',
      reason: 'Could not determine required document type',
      isFileInput: true,
      requiresConfirmation: true,
    };
  }

  // Find default document for the category, or most recent
  const categoryDocs = documents.filter(d => d.category === category);
  const doc = categoryDocs.find(d => d.isDefault) || categoryDocs[0] || null;

  return {
    fieldName: field.name,
    fieldId: field.id,
    fieldType: 'file',
    profileKey: null,
    documentCategory: category,
    document: doc ? {
      id: doc._id,
      label: doc.label,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      downloadUrl: `/uploads/${doc.storagePath}`,
    } : null,
    confidence,
    status: doc ? 'suggested' : 'missing',
    source: 'rule',
    reason: doc
      ? `Matched document category "${category}" — always requires confirmation for file uploads`
      : `No ${category} document uploaded yet`,
    isFileInput: true,
    requiresConfirmation: true,  // Always confirm file uploads
  };
}

module.exports = router;
