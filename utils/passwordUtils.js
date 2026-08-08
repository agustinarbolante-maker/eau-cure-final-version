const bcrypt = require('bcryptjs');

/**
 * Hash a plain text password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a plain text password against a hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Hashed password from database
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
