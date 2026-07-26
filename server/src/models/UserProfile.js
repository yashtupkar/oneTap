const mongoose = require('mongoose');

/**
 * UserProfile — stores all structured identity data for a device.
 * Sensitive identity numbers are stored AES-256-GCM encrypted.
 */
const userProfileSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },

    // ── Personal ──────────────────────────────────────────────────────────────
    firstName: String,
    middleName: String,
    lastName: String,
    fullName: String,
    dateOfBirth: String,     // YYYY-MM-DD
    gender: String,
    nationality: String,

    // ── Contact ───────────────────────────────────────────────────────────────
    email: String,
    phone: String,
    alternatePhone: String,
    linkedIn: String,
    website: String,
    github: String,

    // ── Address ───────────────────────────────────────────────────────────────
    addresses: {
      type: [{
        addressType: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
      }],
      default: []
    },

    // ── Professional ──────────────────────────────────────────────────────────
    workExperience: {
      type: [{
        jobTitle: String,
        company: String,
        location: String,
        startDate: String,
        endDate: String,
        description: String,
        skillsUsed: String
      }],
      default: []
    },
    yearsOfExperience: Number,
    skills: [String],
    summary: String,
    expectedSalary: String,
    noticePeriod: String,

    // ── Education ─────────────────────────────────────────────────────────────
    educationHistory: {
      type: [{
        degree: String,
        fieldOfStudy: String,
        university: String,
        startDate: String,
        endDate: String,
        marks: String
      }],
      default: []
    },

    // ── Identity (stored ENCRYPTED as hex strings) ────────────────────────────
    passportNumber: String,
    panNumber: String,
    aadhaarNumber: String,
    drivingLicenseNumber: String,

    // ── Preferences ───────────────────────────────────────────────────────────
    preferredLanguage: { type: String, default: 'en' },
    timezone: String,

    // ── Custom / Novel Fields ─────────────────────────────────────────────────
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
