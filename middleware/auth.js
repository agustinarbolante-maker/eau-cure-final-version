const { verifyToken } = require('../utils/tokenUtils');

/**
 * Middleware to verify JWT token from Authorization header
 * Adds req.user with {userId, username, role} if valid
 * Returns 401 if missing or invalid
 */
function authenticateToken(req, res, next) {
  // Extract token from Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  authenticateToken,
};
