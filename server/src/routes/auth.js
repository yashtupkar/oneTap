const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Document = require('../models/Document');
const FormSubmission = require('../models/FormSubmission');
const FieldMapping = require('../models/FieldMapping');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Helper to generate token that does not expire (very long expiry).
 * We use 100 years.
 */
function generateToken(deviceId) {
  // 100 years = 36500 days
  return jwt.sign({ deviceId }, JWT_SECRET, { expiresIn: '36500d' });
}

/**
 * POST /api/auth/register
 * Register a new user, and migrate any data associated with their current deviceId.
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('deviceId').notEmpty().withMessage('Current deviceId is required for data migration')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { email, password, deviceId } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already registered' });
      }

      // Create new user
      const user = new User({ email, password });
      await user.save();

      const newUserId = user._id.toString();

      // Migrate existing data from old deviceId to new newUserId
      if (deviceId && deviceId !== newUserId) {
        await Promise.all([
          UserProfile.updateMany({ deviceId }, { $set: { deviceId: newUserId } }),
          Document.updateMany({ deviceId }, { $set: { deviceId: newUserId } }),
          FormSubmission.updateMany({ deviceId }, { $set: { deviceId: newUserId } }),
          FieldMapping.updateMany({ deviceId }, { $set: { deviceId: newUserId } })
        ]);
      }

      const token = generateToken(newUserId);
      res.json({ success: true, token, email: user.email });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email and password.
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken(user._id.toString());
      res.json({ success: true, token, email: user.email });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
