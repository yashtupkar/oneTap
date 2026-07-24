const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Generates a JWT for a given deviceId.
 * @param {string} deviceId
 * @returns {string}
 */
function generateToken(deviceId) {
  return jwt.sign({ deviceId }, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Express middleware that validates the Authorization Bearer JWT
 * and attaches req.deviceId.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  // Also allow deviceId directly via header for simple anonymous sessions
  const deviceIdHeader = req.headers['x-device-id'];

  if (deviceIdHeader) {
    // Simple anonymous device session (no JWT required)
    req.deviceId = deviceIdHeader;
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.deviceId = payload.deviceId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, generateToken };
