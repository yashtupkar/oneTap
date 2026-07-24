const express = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const FormSubmission = require('../models/FormSubmission');
const FieldMapping = require('../models/FieldMapping');
const UserProfile = require('../models/UserProfile');
const { matchFields, computeFieldFingerprint } = require('../services/matchingService');
const { encryptProfileSensitiveFields } = require('../services/encryptionService');

const router = express.Router();
router.use(requireAuth);

/**
 * Computes a short fingerprint for a form based on its field structure.
 * @param {Array} fields
 * @returns {string}
 */
function computeFormFingerprint(fields) {
  const sorted = fields
    .map(f => `${f.name || ''}|${f.type || ''}`)
    .sort()
    .join(',');
  return crypto.createHash('sha256').update(sorted).digest('hex').slice(0, 16);
}

/**
 * POST /api/submissions
 * Save a form submission and update the user profile + field mappings.
 *
 * Body: { url, domain, fields: [{ name, id, label, placeholder, type, value }] }
 */
router.post('/', async (req, res, next) => {
  try {
    const { url, domain, fields } = req.body;

    if (!url || !domain || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'url, domain, and fields are required' });
    }

    const formFingerprint = computeFormFingerprint(fields);

    // Run rule-based matching on submitted fields
    const matches = matchFields(fields);

    // Enrich fields with matched profile keys
    const enrichedFields = fields.map((field, idx) => ({
      ...field,
      profileKey: matches[idx]?.profileKey || null,
      confidence: matches[idx]?.confidence || 0,
    }));

    // Save submission
    const submission = await FormSubmission.create({
      deviceId: req.deviceId,
      url,
      domain,
      formFingerprint,
      fields: enrichedFields,
    });

    // Extract profile updates from the submission
    const profileUpdates = {};
    for (const field of enrichedFields) {
      if (!field.value) continue;

      if (field.profileKey && field.confidence >= 0.65) {
        // For arrays (skills), split by comma
        if (field.profileKey === 'skills') {
          profileUpdates.skills = field.value.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          profileUpdates[field.profileKey] = field.value;
        }
      } else if (!field.profileKey || field.confidence < 0.65) {
        // Novel or low-confidence field -> save in customFields
        let customKey = field.name || field.id;
        if (!customKey && field.label) {
          customKey = field.label.toLowerCase().trim().replace(/[\s\W]+/g, '_');
        }
        if (customKey) {
          profileUpdates[`customFields.${customKey}`] = field.value;
        }
      }
    }

    if (Object.keys(profileUpdates).length > 0) {
      const encryptedUpdates = encryptProfileSensitiveFields(profileUpdates);
      await UserProfile.findOneAndUpdate(
        { deviceId: req.deviceId },
        { $set: encryptedUpdates, $setOnInsert: { deviceId: req.deviceId } },
        { upsert: true }
      );
    }

    // Upsert field mappings with reinforced confidence
    for (const field of enrichedFields) {
      if (!field.profileKey) continue;
      const fingerprint = computeFieldFingerprint(field);

      await FieldMapping.findOneAndUpdate(
        { deviceId: req.deviceId, fieldFingerprint: fingerprint },
        {
          $set: {
            profileKey: field.profileKey,
            fieldDescriptor: {
              name: field.name,
              id: field.id,
              label: field.label,
              placeholder: field.placeholder,
              type: field.type,
            },
            domain,
            lastUsedAt: new Date(),
          },
          $inc: { confirmations: 1 },
          $max: { confidence: field.confidence },
          $setOnInsert: {
            deviceId: req.deviceId,
            fieldFingerprint: fingerprint,
            source: 'rule',
          },
        },
        { upsert: true }
      );
    }

    res.status(201).json({
      success: true,
      submissionId: submission._id,
      profileKeysUpdated: Object.keys(profileUpdates),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/submissions
 * Get recent submissions for this device (for debugging/review).
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const submissions = await FormSubmission.find({ deviceId: req.deviceId })
      .sort({ submittedAt: -1 })
      .limit(Math.min(limit, 50));
    res.json({ success: true, submissions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
