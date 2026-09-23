const jwt = require('jsonwebtoken');
const { jwtSecret, jwtIssuer } = require('../config');

// verify app JWT, null if invalid
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: jwtIssuer,
    });
    return payload && payload.sub ? payload : null;
  } catch {
    return null;
  }
}

// JWT auth middleware
function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies.token : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: authentication required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }

  // identity from verified JWT only
  req.user = {
    id: String(payload.sub),
    login: payload.login,
    name: payload.name,
    avatar: payload.avatar,
  };
  return next();
}

module.exports = { requireAuth, verifyToken };
