const express = require('express');
const db = require('../database');
const { hashPassword } = require('../utils/passwordUtils');
const { authenticateToken } = require('../middleware/auth');
const { requireOwnerOrSoftwareEngineer } = require('../middleware/permissions');

const router = express.Router();

/**
 * GET /users
 * List all users (Owner/Software Engineer only)
 */
router.get('/', authenticateToken, requireOwnerOrSoftwareEngineer, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /users
 * Create new user (Owner/Software Engineer only)
 */
router.post('/', authenticateToken, requireOwnerOrSoftwareEngineer, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Username, email, password, and role required' });
    }

    if (!['owner', 'software_engineer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const passwordHash = await hashPassword(password);
    const userId = await db.createUser(username, email, passwordHash, role);

    res.json({
      id: userId,
      username,
      email,
      role,
      message: 'User created successfully',
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /users/:id
 * Delete user (Owner/Software Engineer only)
 */
router.delete('/:id', authenticateToken, requireOwnerOrSoftwareEngineer, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await db.deleteUserById(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /users/:id/role
 * Change user role (Owner/Software Engineer only)
 */
router.put('/:id/role', authenticateToken, requireOwnerOrSoftwareEngineer, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role required' });
    }

    if (!['owner', 'software_engineer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await db.updateUserRole(userId, role);
    res.json({ message: 'User role updated successfully' });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
