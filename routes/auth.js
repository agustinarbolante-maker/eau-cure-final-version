const express = require('express');
const db = require('../database');
const { hashPassword, verifyPassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/tokenUtils');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /login
 * Login with username and password
 * Returns JWT token on success
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user by username
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = generateToken(user.id, user.username, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * GET /me
 * Get current logged-in user info (protected route)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /logout
 * Logout endpoint (client-side handles token deletion)
 */
router.post('/logout', authenticateToken, (req, res) => {
  // JWT is stateless, so logout is just confirmation
  // Client deletes token from localStorage
  res.json({ message: 'Logout successful' });
});

module.exports = router;
