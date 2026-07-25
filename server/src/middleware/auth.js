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

  // First try to authenticate using the JWT token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.deviceId = payload.deviceId;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // Fallback to simple anonymous device session
  const deviceIdHeader = req.headers['x-device-id'];
  if (deviceIdHeader) {
    req.deviceId = deviceIdHeader;
    return next();
  }

  // Third fallback: query params (used for download links in browser)
  if (req.query.token) {
    try {
      const payload = jwt.verify(req.query.token, JWT_SECRET);
      req.deviceId = payload.deviceId;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token in query' });
    }
  }

  if (req.query.deviceId) {
    req.deviceId = req.query.deviceId;
    return next();
  }

  return res.status(401).json({ error: 'Missing Authorization or X-Device-ID header' });
}

module.exports = { requireAuth, generateToken };
