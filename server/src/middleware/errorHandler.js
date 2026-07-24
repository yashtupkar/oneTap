const { logger } = require('../utils/logger');

/**
 * Centralized Express error handler.
 * Must be registered AFTER all routes (4-argument middleware).
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log the error with context
  logger.error(`${req.method} ${req.originalUrl} → ${err.message}`, {
    stack: err.stack,
    body: req.body,
  });

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: Object.values(err.errors).map(e => e.message),
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry', details: err.keyValue });
  }

  // Handle CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  // Handle multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 10}MB` });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
