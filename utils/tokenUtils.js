const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

/**
 * Generate a JWT token for a user
 * @param {number} userId - User ID
 * @param {string} username - Username
 * @param {string} role - User role (owner, software_engineer, admin)
 * @returns {string} JWT token
 */
function generateToken(userId, username, role) {
  return jwt.sign(
    {
      userId,
      username,
      role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRATION,
    }
  );
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {{userId: number, username: string, role: string}} Decoded token data
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  generateToken,
  verifyToken,
};
