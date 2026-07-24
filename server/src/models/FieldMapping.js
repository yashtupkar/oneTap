const mongoose = require('mongoose');

/**
 * FieldMapping — learned associations between field fingerprints and profile keys.
 * Confidence improves with confirmations, degrades with corrections.
 */
const fieldMappingSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    fieldFingerprint: { type: String, required: true },
    fieldDescriptor: {
      name: String,
      id: String,
      label: String,
      placeholder: String,
      type: { type: String, required: true },
    },
    profileKey: { type: String, required: true },
    confidence: { type: Number, default: 0.5, min: 0, max: 1 },
    confirmations: { type: Number, default: 0 },
    corrections: { type: Number, default: 0 },
    source: { type: String, enum: ['rule', 'ai', 'user'], default: 'rule' },
    domain: String,
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

fieldMappingSchema.index({ deviceId: 1, fieldFingerprint: 1 }, { unique: true });

module.exports = mongoose.model('FieldMapping', fieldMappingSchema);
