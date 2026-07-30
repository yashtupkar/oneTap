const mongoose = require('mongoose');

/**
 * UserProfile — stores all structured identity data for a device.
 * Schema and fields are now fully dynamic.
 */
const userProfileSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    
    // schemaDefinitions holds the dynamic structure (sections, fields, etc.)
    schemaDefinitions: { type: mongoose.Schema.Types.Mixed, default: [] },
    
    // profileData holds the actual data matching the schema keys
    profileData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false, strict: false }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
