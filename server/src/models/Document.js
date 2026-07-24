const mongoose = require('mongoose');

/**
 * Document — stores metadata for uploaded files.
 * Supported categories: resume, cover_letter, passport, aadhaar,
 * pan_card, driving_license, photo, certificate, other.
 */
const documentSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: [
        'resume', 'cover_letter', 'passport', 'aadhaar',
        'pan_card', 'driving_license', 'photo', 'certificate', 'other',
      ],
    },
    label: { type: String, required: true, maxlength: 100 },
    originalName: { type: String, required: true },
    storagePath: { type: String, required: true },  // relative to uploads/
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
    tags: [{ type: String, maxlength: 50 }],
  },
  { timestamps: true, versionKey: false }
);

documentSchema.index({ deviceId: 1, category: 1 });

module.exports = mongoose.model('Document', documentSchema);
