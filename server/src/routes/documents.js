const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const Document = require('../models/Document');

const router = express.Router();
router.use(requireAuth);

// ── Multer configuration ──────────────────────────────────────────────────────
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const deviceDir = path.join(uploadDir, req.deviceId);
    fs.mkdirSync(deviceDir, { recursive: true });
    cb(null, deviceDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024 },
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/documents
 * List all documents for this device, optionally filtered by category.
 */
router.get('/', async (req, res, next) => {
  try {
    const filter = { deviceId: req.deviceId };
    if (req.query.category) filter.category = req.query.category;

    const docs = await Document.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/documents
 * Upload a new document.
 * Body (multipart/form-data): file, category, label, isDefault (optional)
 */
router.post('/', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const { category, label, isDefault, tags } = req.body;

    if (!category || !label) {
      return res.status(400).json({ error: 'category and label are required' });
    }

    // Relative storage path (relative to uploadDir)
    const relativePath = path.join(req.deviceId, req.file.filename);

    // If marking as default, unset existing defaults for this category
    if (isDefault === 'true' || isDefault === true) {
      await Document.updateMany(
        { deviceId: req.deviceId, category },
        { $set: { isDefault: false } }
      );
    }

    const doc = await Document.create({
      deviceId: req.deviceId,
      category,
      label,
      originalName: req.file.originalname,
      storagePath: relativePath,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      isDefault: isDefault === 'true' || isDefault === true,
      tags: tags ? JSON.parse(tags) : [],
    });

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    // Clean up uploaded file if DB save fails
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
});

/**
 * PATCH /api/documents/:id
 * Update document metadata (label, isDefault, tags, category).
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, deviceId: req.deviceId });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const { label, isDefault, tags, category } = req.body;

    if (isDefault === true || isDefault === 'true') {
      await Document.updateMany(
        { deviceId: req.deviceId, category: doc.category },
        { $set: { isDefault: false } }
      );
    }

    Object.assign(doc, {
      ...(label && { label }),
      ...(isDefault !== undefined && { isDefault: isDefault === true || isDefault === 'true' }),
      ...(tags && { tags }),
      ...(category && { category }),
    });

    await doc.save();
    res.json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/documents/:id
 * Delete document and its file from disk.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, deviceId: req.deviceId });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Delete file from disk
    const fullPath = path.join(uploadDir, doc.storagePath);
    fs.unlink(fullPath, (err) => {
      if (err) console.warn('File delete warning:', err.message);
    });

    await doc.deleteOne();
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/documents/:id/download
 * Serve the file for download.
 */
router.get('/:id/download', async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, deviceId: req.deviceId });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const fullPath = path.join(uploadDir, doc.storagePath);
    res.download(fullPath, doc.originalName);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
