const mongoose = require('mongoose');

/** Schema for a single captured field from a form submission */
const capturedFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    id: String,
    label: String,
    placeholder: String,
    type: { type: String, required: true },
    value: { type: String, required: true },
    profileKey: String,   // resolved profile key, if any
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const formSubmissionSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    domain: { type: String, required: true, index: true },
    formFingerprint: { type: String, required: true, index: true },
    fields: { type: [capturedFieldSchema], required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

formSubmissionSchema.index({ deviceId: 1, formFingerprint: 1, submittedAt: -1 });

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
