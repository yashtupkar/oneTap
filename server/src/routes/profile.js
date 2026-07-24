const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const UserProfile = require('../models/UserProfile');
const {
  encryptProfileSensitiveFields,
  decryptProfileSensitiveFields,
} = require('../services/encryptionService');

const router = express.Router();

// All routes require auth
router.use(requireAuth);

/**
 * GET /api/profile
 * Returns the current user profile (sensitive fields decrypted).
 */
router.get('/', async (req, res, next) => {
  try {
    let profile = await UserProfile.findOne({ deviceId: req.deviceId });
    if (!profile) {
      // Auto-create empty profile on first access
      profile = await UserProfile.create({ deviceId: req.deviceId });
    }
    res.json({ success: true, profile: decryptProfileSensitiveFields(profile) });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/profile
 * Creates or fully replaces the profile.
 */
router.put(
  '/',
  [
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone'),
    body('graduationYear').optional().isInt({ min: 1950, max: 2100 }).withMessage('Invalid graduation year'),
    body('yearsOfExperience').optional().isFloat({ min: 0, max: 60 }).withMessage('Invalid experience'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const data = encryptProfileSensitiveFields(req.body);
      const profile = await UserProfile.findOneAndUpdate(
        { deviceId: req.deviceId },
        { ...data, deviceId: req.deviceId },
        { new: true, upsert: true, runValidators: true }
      );
      res.json({ success: true, profile: decryptProfileSensitiveFields(profile) });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/profile
 * Partially updates specific fields.
 */
router.patch('/', async (req, res, next) => {
  try {
    const data = encryptProfileSensitiveFields(req.body);
    // Prevent overwriting deviceId
    delete data.deviceId;

    const profile = await UserProfile.findOneAndUpdate(
      { deviceId: req.deviceId },
      { $set: data },
      { new: true, upsert: true }
    );
    res.json({ success: true, profile: decryptProfileSensitiveFields(profile) });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/profile
 * Deletes all profile data for this device.
 */
router.delete('/', async (req, res, next) => {
  try {
    await UserProfile.deleteOne({ deviceId: req.deviceId });
    res.json({ success: true, message: 'Profile deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
