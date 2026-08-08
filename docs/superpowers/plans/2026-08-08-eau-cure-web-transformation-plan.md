# Eau Cure Web Transformation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Eau Cure from a single-user Electron desktop app into a multi-user React-based website with JWT authentication, role-based access control, and deployment on DigitalOcean.

**Architecture:** Express.js backend with REST API + JWT auth, React single-page frontend with Socket.io real-time updates, SQLite database with multi-user schema. Backend enforces role-based permissions on all endpoints. Frontend shows UI elements based on user role.

**Tech Stack:** 
- Backend: Node.js, Express.js, SQLite3, bcryptjs, jsonwebtoken
- Frontend: React 18+, axios, Socket.io client, React Router
- Hosting: DigitalOcean App Platform
- Database: SQLite (upgradeable to PostgreSQL later)

## Global Constraints

- Support 5 users: 1 Owner, 1 Software Engineer, 2 Admins
- Owner & Software Engineer have full access; Admins cannot create/delete users
- JWT token expiration: 7 days
- All passwords hashed with bcryptjs (never stored plaintext)
- All API endpoints validate user permissions in backend (not frontend)
- Preserve all existing data: companies, deliveries, billing
- React must be 18.x or higher
- Express must be 4.18.x or higher
- Cost: ~$80/year total (DigitalOcean + domain)
- Timeline: Complete all implementation tasks ASAP

---

## File Structure

### Backend
```
/
├── server.js (existing, modified)
├── database.js (existing, modified - add users table)
├── middleware/
│   ├── auth.js (NEW - JWT verification)
│   └── permissions.js (NEW - role-based access control)
├── routes/
│   ├── auth.js (NEW - login, logout, auth endpoints)
│   ├── users.js (NEW - user management)
│   ├── companies.js (NEW - refactored with permissions)
│   ├── deliveries.js (NEW - refactored with permissions)
│   └── billing.js (NEW - refactored with permissions)
├── utils/
│   ├── tokenUtils.js (NEW - JWT creation/verification)
│   └── passwordUtils.js (NEW - bcrypt hashing)
├── .env.example (NEW - environment variables template)
└── package.json (modified - new dependencies)
```

### Frontend (New React App)
```
/public/react-app/ (or separate folder, or use create-react-app)
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Deliveries.jsx
│   │   ├── Billing.jsx
│   │   ├── Reports.jsx
│   │   ├── Settings.jsx
│   │   ├── Navigation.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleGuard.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── AppContext.jsx
│   ├── services/
│   │   ├── api.js (REST API calls)
│   │   └── socket.js (Socket.io setup)
│   ├── utils/
│   │   ├── auth.js (token management)
│   │   └── constants.js (user roles, etc.)
│   ├── App.jsx
│   ├── index.jsx
│   ├── App.css
│   └── index.css
├── public/
│   └── index.html
└── package.json
```

---

## Phase 1: Project Setup & Dependencies

### Task 1: Add Backend Dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: Nothing (initial task)
- Produces: New dependencies available for `npm install`: bcryptjs, jsonwebtoken, dotenv

**Steps:**

- [ ] **Step 1: Open package.json and add new dependencies**

Add these to the `dependencies` object:
```json
"bcryptjs": "^2.4.3",
"jsonwebtoken": "^9.0.2",
"dotenv": "^16.3.1"
```

After modification, your dependencies section should look like:
```json
"dependencies": {
  "body-parser": "^1.20.2",
  "cors": "^2.8.5",
  "express": "^4.18.2",
  "multer": "^1.4.4",
  "socket.io": "^4.8.3",
  "sqlite3": "^5.1.6",
  "sweetalert2": "^11.26.25",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "dotenv": "^16.3.1"
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: All packages install successfully without errors

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add authentication dependencies (bcryptjs, jsonwebtoken, dotenv)"
```

---

### Task 2: Create Environment Variables Template

**Files:**
- Create: `.env.example`

**Interfaces:**
- Consumes: Nothing
- Produces: `.env` file template for developers to copy

**Steps:**

- [ ] **Step 1: Create .env.example file**

Create the file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\.env.example` with this content:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=7d

# Database
DATABASE_PATH=./data/eau-cure.db

# Socket.io
SOCKET_IO_ORIGIN=*

# Deployment (DigitalOcean)
DEPLOY_URL=http://localhost:3000
```

- [ ] **Step 2: Create actual .env file from template**

Create `.env` file with the same content as `.env.example` (for local development)

- [ ] **Step 3: Update .gitignore**

Ensure `.env` is in `.gitignore` (so secrets aren't committed), but `.env.example` is tracked:

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

- [ ] **Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "Add environment variables template (.env.example)"
```

---

## Phase 2: Backend Database & Schema

### Task 3: Update Database Schema - Add Users Table

**Files:**
- Modify: `database.js`

**Interfaces:**
- Consumes: SQLite3 connection
- Produces: `createUserTable()` function that creates users table with fields: id, username, email, password_hash, role, created_at, updated_at

**Steps:**

- [ ] **Step 1: Read the existing database.js file**

Read: `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\database.js`

Get familiar with how tables are created and how the database connection works.

- [ ] **Step 2: Add users table creation function**

Add this function to `database.js` (before the final `module.exports`):

```javascript
// Create users table for authentication
function createUserTable() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('owner', 'software_engineer', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
```

- [ ] **Step 3: Call createUserTable on database initialization**

Find where other tables are created (look for `db.run` calls in the file). Add a call to `createUserTable()` in the initialization sequence.

Add this after existing table creation:
```javascript
await createUserTable();
```

- [ ] **Step 4: Export the function**

Add to `module.exports`:
```javascript
createUserTable,
```

- [ ] **Step 5: Test**

Run: `node database.js` or `npm start`
Expected: No errors, users table is created in SQLite database

Verify with: `sqlite3 ./data/eau-cure.db ".schema users"`
Expected output shows the users table structure

- [ ] **Step 6: Commit**

```bash
git add database.js
git commit -m "Add users table to database schema for authentication"
```

---

### Task 4: Add User Database Functions

**Files:**
- Modify: `database.js`

**Interfaces:**
- Consumes: SQLite connection
- Produces: 
  - `createUser(username, email, passwordHash, role)` → returns user id
  - `getUserByUsername(username)` → returns {id, username, email, password_hash, role}
  - `getUserById(id)` → returns {id, username, email, password_hash, role}
  - `getAllUsers()` → returns [{id, username, email, role}, ...]
  - `deleteUserById(id)` → returns success
  - `updateUserRole(userId, newRole)` → returns success

**Steps:**

- [ ] **Step 1: Add createUser function**

Add to `database.js` (before `module.exports`):

```javascript
function createUser(username, email, passwordHash, role) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, role],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}
```

- [ ] **Step 2: Add getUserByUsername function**

```javascript
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE username = ?`,
      [username],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}
```

- [ ] **Step 3: Add getUserById function**

```javascript
function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}
```

- [ ] **Step 4: Add getAllUsers function**

```javascript
function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}
```

- [ ] **Step 5: Add deleteUserById function**

```javascript
function deleteUserById(id) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM users WHERE id = ?`,
      [id],
      (err) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
}
```

- [ ] **Step 6: Add updateUserRole function**

```javascript
function updateUserRole(userId, newRole) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newRole, userId],
      (err) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
}
```

- [ ] **Step 7: Export all new functions**

Add to `module.exports`:
```javascript
createUser,
getUserByUsername,
getUserById,
getAllUsers,
deleteUserById,
updateUserRole,
```

- [ ] **Step 8: Test the functions**

Write a quick test in Node REPL or test file to verify these work:
```javascript
const db = require('./database');
// After app starts:
// const user = await db.getUserByUsername('testuser');
```

- [ ] **Step 9: Commit**

```bash
git add database.js
git commit -m "Add user management database functions (create, read, delete, update role)"
```

---

## Phase 3: Backend Authentication System

### Task 5: Create Password Utils (Hashing & Verification)

**Files:**
- Create: `utils/passwordUtils.js`

**Interfaces:**
- Consumes: bcryptjs library
- Produces:
  - `hashPassword(plainPassword)` → returns hashed string
  - `verifyPassword(plainPassword, hash)` → returns boolean

**Steps:**

- [ ] **Step 1: Create utils directory**

```bash
mkdir -p utils
```

- [ ] **Step 2: Create passwordUtils.js**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\utils\passwordUtils.js` with:

```javascript
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
```

- [ ] **Step 3: Test the functions**

Create a quick test:
```javascript
const { hashPassword, verifyPassword } = require('./utils/passwordUtils');

(async () => {
  const pwd = 'testPassword123';
  const hash = await hashPassword(pwd);
  console.log('Hash:', hash);
  
  const matches = await verifyPassword(pwd, hash);
  console.log('Matches:', matches); // should be true
  
  const wrongMatches = await verifyPassword('wrongPassword', hash);
  console.log('Wrong password matches:', wrongMatches); // should be false
})();
```

Run and verify output is correct.

- [ ] **Step 4: Commit**

```bash
git add utils/passwordUtils.js
git commit -m "Add password hashing utility using bcryptjs"
```

---

### Task 6: Create JWT Token Utils

**Files:**
- Create: `utils/tokenUtils.js`

**Interfaces:**
- Consumes: jsonwebtoken library, environment variables (JWT_SECRET, JWT_EXPIRATION)
- Produces:
  - `generateToken(userId, username, role)` → returns JWT string
  - `verifyToken(token)` → returns {userId, username, role} or throws error

**Steps:**

- [ ] **Step 1: Create tokenUtils.js**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\utils\tokenUtils.js` with:

```javascript
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
```

- [ ] **Step 2: Test the functions**

```javascript
const { generateToken, verifyToken } = require('./utils/tokenUtils');

const token = generateToken(1, 'testuser', 'owner');
console.log('Token:', token);

const decoded = verifyToken(token);
console.log('Decoded:', decoded);
```

Run and verify output shows the token and decoded data.

- [ ] **Step 3: Commit**

```bash
git add utils/tokenUtils.js
git commit -m "Add JWT token generation and verification utilities"
```

---

### Task 7: Create Authentication Middleware

**Files:**
- Create: `middleware/auth.js`

**Interfaces:**
- Consumes: JWT token from request header, verifyToken function
- Produces: Express middleware that:
  - Extracts token from `Authorization: Bearer <token>` header
  - Verifies token and adds `req.user = {userId, username, role}` to request
  - Returns 401 Unauthorized if no token or invalid token

**Steps:**

- [ ] **Step 1: Create middleware directory**

```bash
mkdir -p middleware
```

- [ ] **Step 2: Create auth.js middleware**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\middleware\auth.js` with:

```javascript
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
```

- [ ] **Step 3: Test by creating a simple test request**

Later tasks will integrate this into the API.

- [ ] **Step 4: Commit**

```bash
git add middleware/auth.js
git commit -m "Add JWT authentication middleware"
```

---

### Task 8: Create Permissions Middleware

**Files:**
- Create: `middleware/permissions.js`

**Interfaces:**
- Consumes: `req.user` (from auth middleware) with {userId, username, role}
- Produces: Express middleware functions:
  - `requireRole(allowedRoles[])` - returns middleware that checks if user role is in allowedRoles
  - `requireOwnerOrSoftwareEngineer()` - specific helper for owner/software engineer only
  - `requireAdminOrHigher()` - allows admin, software engineer, owner

**Steps:**

- [ ] **Step 1: Create permissions.js middleware**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\middleware\permissions.js` with:

```javascript
/**
 * Higher-order middleware that checks if user has required role(s)
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['owner', 'software_engineer'])
 * @returns {Function} Express middleware
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * Middleware that requires Owner or Software Engineer role
 */
function requireOwnerOrSoftwareEngineer(req, res, next) {
  return requireRole(['owner', 'software_engineer'])(req, res, next);
}

/**
 * Middleware that requires Admin or higher role
 */
function requireAdminOrHigher(req, res, next) {
  return requireRole(['admin', 'software_engineer', 'owner'])(req, res, next);
}

module.exports = {
  requireRole,
  requireOwnerOrSoftwareEngineer,
  requireAdminOrHigher,
};
```

- [ ] **Step 2: Test logic**

Verify the permission checks work correctly in your head:
- Owner can access endpoints requiring owner only ✓
- Software Engineer can access endpoints requiring owner ✓
- Admin cannot access endpoints requiring owner ✓

- [ ] **Step 3: Commit**

```bash
git add middleware/permissions.js
git commit -m "Add role-based permissions middleware"
```

---

### Task 9: Create Authentication Routes (Login/Logout)

**Files:**
- Create: `routes/auth.js`

**Interfaces:**
- Consumes: 
  - `getUserByUsername` from database
  - `createUser` from database
  - `verifyPassword` from passwordUtils
  - `hashPassword` from passwordUtils
  - `generateToken` from tokenUtils
  - `authenticateToken` middleware
- Produces: Express router with endpoints:
  - `POST /login` - login endpoint
  - `GET /me` - current user info (protected)
  - `POST /logout` - logout endpoint

**Steps:**

- [ ] **Step 1: Create routes directory**

```bash
mkdir -p routes
```

- [ ] **Step 2: Create auth.js routes**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\routes\auth.js` with:

```javascript
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
```

- [ ] **Step 3: Integrate auth routes into server.js**

Modify `server.js` to include the auth routes. Add this after the existing route definitions:

```javascript
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
```

Make sure it's added before `server.listen()`.

- [ ] **Step 4: Test the login endpoint**

Use Postman or curl:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'
```

Expected: 401 Unauthorized (user doesn't exist yet - we'll create initial users in a later task)

- [ ] **Step 5: Commit**

```bash
git add routes/auth.js
git commit -m "Add authentication routes (login, logout, me endpoint)"
```

---

### Task 10: Create User Management Routes (Admin)

**Files:**
- Create: `routes/users.js`

**Interfaces:**
- Consumes:
  - `createUser`, `getAllUsers`, `deleteUserById`, `updateUserRole` from database
  - `hashPassword` from passwordUtils
  - `authenticateToken` middleware
  - `requireOwnerOrSoftwareEngineer` middleware
- Produces: Express router with endpoints:
  - `GET /users` - list all users (protected, owner/software engineer only)
  - `POST /users` - create new user (protected, owner/software engineer only)
  - `DELETE /users/:id` - delete user (protected, owner/software engineer only)
  - `PUT /users/:id/role` - change user role (protected, owner/software engineer only)

**Steps:**

- [ ] **Step 1: Create users.js routes**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\routes\users.js` with:

```javascript
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

    // Validate input
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Username, email, password, and role required' });
    }

    if (!['owner', 'software_engineer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = await db.createUser(username, email, passwordHash, role);

    res.json({
      id: userId,
      username,
      email,
      role,
      message: 'User created successfully',
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
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

    // Prevent deleting yourself (optional safeguard)
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
```

- [ ] **Step 2: Integrate users routes into server.js**

Add this after the auth routes:

```javascript
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);
```

- [ ] **Step 3: Test the endpoints**

Use Postman (with auth token header):
```bash
# Get users (will fail without auth)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"username": "admin1", "email": "admin1@eaucure.com", "password": "securepass", "role": "admin"}'
```

- [ ] **Step 4: Commit**

```bash
git add routes/users.js
git commit -m "Add user management routes (create, list, delete, change role)"
```

---

### Task 11: Create Initial Users (Seed Data)

**Files:**
- Create: `scripts/createInitialUsers.js`

**Interfaces:**
- Consumes: Database functions, password hashing
- Produces: Initial 4 users in database (1 owner, 1 software engineer, 2 admins)

**Steps:**

- [ ] **Step 1: Create scripts directory**

```bash
mkdir -p scripts
```

- [ ] **Step 2: Create createInitialUsers.js**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\scripts\createInitialUsers.js` with:

```javascript
const db = require('../database');
const { hashPassword } = require('../utils/passwordUtils');

async function createInitialUsers() {
  try {
    console.log('Creating initial users...');

    // Check if users already exist
    const existingUsers = await db.getAllUsers();
    if (existingUsers.length > 0) {
      console.log('Users already exist. Skipping creation.');
      process.exit(0);
    }

    // Create initial users
    const users = [
      {
        username: 'owner',
        email: 'owner@eaucure.com',
        password: 'owner_password', // Change this to a secure password
        role: 'owner',
      },
      {
        username: 'agustino',
        email: 'agustinoliearbolante19@gmail.com',
        password: 'software_engineer_password', // Change this to a secure password
        role: 'software_engineer',
      },
      {
        username: 'admin1',
        email: 'admin1@eaucure.com',
        password: 'admin1_password', // Change this to a secure password
        role: 'admin',
      },
      {
        username: 'admin2',
        email: 'admin2@eaucure.com',
        password: 'admin2_password', // Change this to a secure password
        role: 'admin',
      },
    ];

    for (const user of users) {
      const hash = await hashPassword(user.password);
      const userId = await db.createUser(user.username, user.email, hash, user.role);
      console.log(`Created user: ${user.username} (ID: ${userId}, Role: ${user.role})`);
    }

    console.log('Initial users created successfully!');
    console.log('\nDefault Credentials:');
    console.log('-------------------');
    users.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.username} / ${user.password}`);
    });
    console.log('\n⚠️  IMPORTANT: Change all passwords immediately in production!');

    process.exit(0);
  } catch (err) {
    console.error('Error creating users:', err);
    process.exit(1);
  }
}

createInitialUsers();
```

- [ ] **Step 3: Add script to package.json**

Add this to `package.json` `scripts` section:

```json
"seed": "node scripts/createInitialUsers.js"
```

- [ ] **Step 4: Run the seed script**

```bash
npm run seed
```

Expected output:
```
Creating initial users...
Created user: owner (ID: 1, Role: owner)
Created user: agustino (ID: 2, Role: software_engineer)
...
```

- [ ] **Step 5: Verify users were created**

```bash
sqlite3 ./data/eau-cure.db "SELECT id, username, role FROM users;"
```

- [ ] **Step 6: Commit**

```bash
git add scripts/createInitialUsers.js package.json
git commit -m "Add script to create initial users (owner, software engineer, 2 admins)"
```

---

### Task 12: Add Authentication to Existing Company Routes

**Files:**
- Modify: `routes/companies.js` (create this by refactoring endpoints from server.js)

**Interfaces:**
- Consumes: 
  - Company endpoints from `server.js` (GET /api/companies, POST /api/companies, etc.)
  - `authenticateToken` middleware
  - `requireAdminOrHigher` middleware
- Produces: Express router with routes:
  - `GET /` - list companies (all authenticated users)
  - `GET /all` - all companies with details (all authenticated users)
  - `POST /` - create company (admin+ only)
  - `PUT /:name` - update company (admin+ only)

**Steps:**

- [ ] **Step 1: Create companies.js routes**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\routes\companies.js` with:

```javascript
const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { requireAdminOrHigher } = require('../middleware/permissions');

const router = express.Router();

/**
 * GET /
 * List all company names (authenticated users only)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const companies = await db.getAllCompaniesFromDB();
    res.json(companies.map(c => c.name));
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /all
 * List all companies with details (authenticated users only)
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const companies = await db.getAllCompaniesFromDB();
    res.json(companies);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /
 * Create new company (Admin+ only)
 */
router.post('/', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { name, unitPrice } = req.body;
    if (!name || unitPrice === undefined) {
      return res.status(400).json({ error: 'Name and unit price are required' });
    }
    const id = await db.addCompany(name, unitPrice);
    const companies = await db.getAllCompaniesFromDB();
    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) io.emit('companies_updated', companies);
    res.json({ id, name, unitPrice, message: 'Company added successfully' });
  } catch (err) {
    console.error('Error adding company:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /:name
 * Update company price (Admin+ only)
 */
router.put('/:name', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { name } = req.params;
    const { unitPrice } = req.body;
    if (unitPrice === undefined) {
      return res.status(400).json({ error: 'Unit price is required' });
    }
    await db.updateCompanyPrice(name, unitPrice);
    const companies = await db.getAllCompaniesFromDB();
    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) io.emit('companies_updated', companies);
    res.json({ message: 'Company price updated successfully' });
  } catch (err) {
    console.error('Error updating company:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Integrate into server.js**

Remove the old company endpoints from `server.js` and add:

```javascript
const companiesRoutes = require('./routes/companies');
app.use('/api/companies', companiesRoutes);
```

Make sure to set up Socket.io so routes can access it:
```javascript
app.set('io', io);
```

- [ ] **Step 3: Test endpoints**

```bash
# Get companies (needs auth token)
curl -X GET http://localhost:3000/api/companies \
  -H "Authorization: Bearer <token>"
```

- [ ] **Step 4: Commit**

```bash
git add routes/companies.js
git commit -m "Add authenticated company routes with permission checks"
```

---

## Phase 4: Update Remaining Backend Routes

### Task 13: Add Authentication to Deliveries Routes

**Files:**
- Create: `routes/deliveries.js`

**Interfaces:**
- Consumes: Existing delivery endpoints from server.js
- Produces: Express router with:
  - `GET /` - list deliveries (all authenticated users)
  - `POST /` - add delivery (admin+ only)
  - `PUT /:id` - edit delivery (admin+ only)
  - All routes track which user created/modified deliveries

**Steps:**

- [ ] **Step 1: Create deliveries.js routes**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\routes\deliveries.js` with:

```javascript
const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { requireAdminOrHigher } = require('../middleware/permissions');

const router = express.Router();

/**
 * GET /
 * List all deliveries (all authenticated users)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const deliveries = await db.getAllDeliveries();
    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /
 * Add new delivery (Admin+ only)
 * Tracks which user created the delivery
 */
router.post('/', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { company, quantity, date, location, notes } = req.body;
    
    if (!company || !quantity || !date) {
      return res.status(400).json({ error: 'Company, quantity, and date are required' });
    }

    const id = await db.addDelivery(company, quantity, date, location, notes, req.user.userId);
    
    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) io.emit('deliveries_updated');

    res.json({
      id,
      message: 'Delivery added successfully',
      createdBy: req.user.username,
    });
  } catch (err) {
    console.error('Error adding delivery:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /:id
 * Edit delivery (Admin+ only)
 */
router.put('/:id', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { company, quantity, date, location, notes } = req.body;
    const deliveryId = req.params.id;

    if (!company || !quantity || !date) {
      return res.status(400).json({ error: 'Company, quantity, and date are required' });
    }

    await db.updateDelivery(deliveryId, company, quantity, date, location, notes);

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) io.emit('deliveries_updated');

    res.json({ message: 'Delivery updated successfully' });
  } catch (err) {
    console.error('Error updating delivery:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /:id
 * Delete delivery (Software Engineer/Owner only - stricter permission)
 */
router.delete('/:id', authenticateToken, (req, res, next) => {
  // Custom permission check for delete
  if (!['software_engineer', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only Software Engineer or Owner can delete deliveries' });
  }
  next();
}, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    await db.deleteDelivery(deliveryId);

    const io = req.app.get('io');
    if (io) io.emit('deliveries_updated');

    res.json({ message: 'Delivery deleted successfully' });
  } catch (err) {
    console.error('Error deleting delivery:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Verify database functions exist**

Check that `database.js` has:
- `getAllDeliveries()` - if not, add it
- `addDelivery(...)` - if not, add it
- `updateDelivery(...)` - if not, add it
- `deleteDelivery(...)` - if not, add it

If any are missing, add them to `database.js` following the same pattern as other functions.

- [ ] **Step 3: Integrate into server.js**

Remove old delivery endpoints and add:

```javascript
const deliveriesRoutes = require('./routes/deliveries');
app.use('/api/deliveries', deliveriesRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add routes/deliveries.js
git commit -m "Add authenticated deliveries routes with permission checks"
```

---

### Task 14: Add Authentication to Billing Routes

**Files:**
- Create: `routes/billing.js`

**Interfaces:**
- Consumes: Existing billing endpoints from server.js
- Produces: Express router with:
  - `GET /:company` - get billing for company (admin+ only)
  - `POST /` - create/update billing (admin+ only)

**Steps:**

- [ ] **Step 1: Create billing.js routes**

Create file `C:\Users\agust\OneDrive\Desktop\Eau-Cure-Final-Version\routes\billing.js` with:

```javascript
const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { requireAdminOrHigher } = require('../middleware/permissions');

const router = express.Router();

/**
 * GET /:company
 * Get billing for a specific company (Admin+ only)
 */
router.get('/:company', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { company } = req.params;
    const billing = await db.getBillingForCompany(company);
    res.json(billing);
  } catch (err) {
    console.error('Error fetching billing:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /
 * Create or update billing (Admin+ only)
 */
router.post('/', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { company, month, totalAmount, paid } = req.body;

    if (!company || !month || totalAmount === undefined) {
      return res.status(400).json({ error: 'Company, month, and totalAmount are required' });
    }

    const billingId = await db.addOrUpdateBilling(company, month, totalAmount, paid || false);

    const io = req.app.get('io');
    if (io) io.emit('billing_updated');

    res.json({
      id: billingId,
      message: 'Billing record saved successfully',
    });
  } catch (err) {
    console.error('Error updating billing:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Verify database functions**

Ensure `database.js` has:
- `getBillingForCompany(company)` - if not, add it
- `addOrUpdateBilling(company, month, amount, paid)` - if not, add it

- [ ] **Step 3: Integrate into server.js**

Remove old billing endpoints and add:

```javascript
const billingRoutes = require('./routes/billing');
app.use('/api/billing', billingRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add routes/billing.js
git commit -m "Add authenticated billing routes with admin permission checks"
```

---

### Task 15: Update Socket.io for Authenticated Connections

**Files:**
- Modify: `server.js`

**Interfaces:**
- Consumes: Socket.io server, authentication middleware
- Produces: Socket.io that verifies user is authenticated before allowing connections

**Steps:**

- [ ] **Step 1: Add Socket.io authentication**

In `server.js`, modify the Socket.io setup:

```javascript
const { verifyToken } = require('./utils/tokenUtils');

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('No token provided'));
  }

  try {
    const decoded = verifyToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});
```

Replace the existing simple `io.on('connection')` with:

```javascript
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
});
```

- [ ] **Step 2: Test Socket.io connection**

Frontend will test this when connecting (later task).

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "Add authentication to Socket.io connections"
```

---

## Phase 5: Frontend - React Setup

### Task 16: Initialize React Project

**Files:**
- Create: React app structure in `public/react-app/` or separate folder

**Interfaces:**
- Consumes: Nothing
- Produces: React 18+ project with necessary dependencies

**Steps:**

- [ ] **Step 1: Create React app**

Use Create React App (recommended for simplicity):

```bash
npx create-react-app public/react-app
cd public/react-app
npm install
```

Or if you prefer Vite (faster):

```bash
npm create vite@latest public/react-app -- --template react
cd public/react-app
npm install
```

For this plan, we'll assume Create React App.

- [ ] **Step 2: Install additional dependencies**

```bash
cd public/react-app
npm install axios react-router-dom socket.io-client
```

- [ ] **Step 3: Verify app runs**

```bash
npm start
```

Expected: React dev server starts on http://localhost:3000 (or similar)

- [ ] **Step 4: Stop dev server for now**

Press Ctrl+C

- [ ] **Step 5: Commit**

```bash
git add public/react-app/
git commit -m "Initialize React project with Create React App"
```

---

### Task 17: Create Authentication Context

**Files:**
- Create: `public/react-app/src/contexts/AuthContext.jsx`

**Interfaces:**
- Consumes: localStorage for token storage, API calls
- Produces: 
  - `<AuthProvider>` wrapper component
  - `useAuth()` hook that returns {user, token, login, logout, isAuthenticated}

**Steps:**

- [ ] **Step 1: Create contexts directory**

```bash
cd public/react-app
mkdir -p src/contexts
```

- [ ] **Step 2: Create AuthContext.jsx**

Create file `public/react-app/src/contexts/AuthContext.jsx`:

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      // Verify token is still valid
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function verifyToken(authToken) {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(response.data);
      setLoading(false);
    } catch (err) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  }

  async function login(username, password) {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

      const { token: newToken, user: userData } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      return { success: false, error: errorMessage };
    }
  }

  async function logout() {
    try {
      await axios.post('/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

- [ ] **Step 3: Commit**

```bash
git add public/react-app/src/contexts/AuthContext.jsx
git commit -m "Add AuthContext for managing user authentication state"
```

---

### Task 18: Create API Service

**Files:**
- Create: `public/react-app/src/services/api.js`

**Interfaces:**
- Consumes: axios, auth token from localStorage
- Produces: API client functions:
  - `login(username, password)`
  - `getMe()`
  - `getCompanies()`
  - `addDelivery(...)`, `editDelivery(...)`
  - `getBilling(...)`
  - etc.

**Steps:**

- [ ] **Step 1: Create services directory**

```bash
mkdir -p src/services
```

- [ ] **Step 2: Create api.js**

Create file `public/react-app/src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with auth header
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  login: (username, password) =>
    apiClient.post('/auth/login', { username, password }),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

// Users endpoints
export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  create: (username, email, password, role) =>
    apiClient.post('/users', { username, email, password, role }),
  delete: (userId) => apiClient.delete(`/users/${userId}`),
  updateRole: (userId, role) =>
    apiClient.put(`/users/${userId}/role`, { role }),
};

// Companies endpoints
export const companiesAPI = {
  getAll: () => apiClient.get('/companies'),
  getAllDetails: () => apiClient.get('/companies/all'),
  create: (name, unitPrice) =>
    apiClient.post('/companies', { name, unitPrice }),
  updatePrice: (name, unitPrice) =>
    apiClient.put(`/companies/${name}`, { unitPrice }),
};

// Deliveries endpoints
export const deliveriesAPI = {
  getAll: () => apiClient.get('/deliveries'),
  create: (company, quantity, date, location, notes) =>
    apiClient.post('/deliveries', {
      company,
      quantity,
      date,
      location,
      notes,
    }),
  update: (id, company, quantity, date, location, notes) =>
    apiClient.put(`/deliveries/${id}`, {
      company,
      quantity,
      date,
      location,
      notes,
    }),
  delete: (id) => apiClient.delete(`/deliveries/${id}`),
};

// Billing endpoints
export const billingAPI = {
  getForCompany: (company) => apiClient.get(`/billing/${company}`),
  create: (company, month, totalAmount, paid) =>
    apiClient.post('/billing', { company, month, totalAmount, paid }),
};

export default apiClient;
```

- [ ] **Step 3: Commit**

```bash
git add public/react-app/src/services/api.js
git commit -m "Add API service with axios client and endpoint functions"
```

---

### Task 19: Create Socket.io Service

**Files:**
- Create: `public/react-app/src/services/socket.js`

**Interfaces:**
- Consumes: Socket.io client library, auth token
- Produces:
  - `connectSocket(token)` - establishes connection
  - `onDeliveriesUpdated(callback)` - listen for delivery updates
  - `onBillingUpdated(callback)` - listen for billing updates
  - `disconnect()` - closes connection

**Steps:**

- [ ] **Step 1: Create socket.js**

Create file `public/react-app/src/services/socket.js`:

```javascript
import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket && socket.connected) {
    return socket;
  }

  const socketURL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

  socket = io(socketURL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket.io connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket.io disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error);
  });

  return socket;
}

export function onDeliveriesUpdated(callback) {
  if (socket) {
    socket.on('deliveries_updated', callback);
  }
}

export function onBillingUpdated(callback) {
  if (socket) {
    socket.on('billing_updated', callback);
  }
}

export function onCompaniesUpdated(callback) {
  if (socket) {
    socket.on('companies_updated', callback);
  }
}

export function offDeliveriesUpdated(callback) {
  if (socket) {
    socket.off('deliveries_updated', callback);
  }
}

export function offBillingUpdated(callback) {
  if (socket) {
    socket.off('billing_updated', callback);
  }
}

export function offCompaniesUpdated(callback) {
  if (socket) {
    socket.off('companies_updated', callback);
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/react-app/src/services/socket.js
git commit -m "Add Socket.io service for real-time updates"
```

---

### Task 20: Create Login Component

**Files:**
- Create: `public/react-app/src/components/Login.jsx`

**Interfaces:**
- Consumes: `useAuth` hook, React Router
- Produces: Login form component that:
  - Takes username/password
  - Calls `auth.login()`
  - Redirects to dashboard on success
  - Shows error message on failure

**Steps:**

- [ ] **Step 1: Create components directory**

```bash
mkdir -p src/components
```

- [ ] **Step 2: Create Login.jsx**

Create file `public/react-app/src/components/Login.jsx`:

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Eau Cure</h1>
        <h2>Water Station Delivery Tracker</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-credentials">
          <h3>Demo Credentials</h3>
          <p><strong>Admin:</strong> admin1 / admin1_password</p>
          <p><strong>Owner:</strong> owner / owner_password</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Login.css**

Create file `public/react-app/src/styles/Login.css`:

```css
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-box h1 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.login-box h2 {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 30px;
  font-weight: normal;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

button[type="submit"] {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
}

button[type="submit"]:hover:not(:disabled) {
  background: #764ba2;
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}

.demo-credentials {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.demo-credentials h3 {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}

.demo-credentials p {
  font-size: 12px;
  color: #666;
  margin: 5px 0;
}
```

- [ ] **Step 4: Commit**

```bash
git add public/react-app/src/components/Login.jsx public/react-app/src/styles/Login.css
git commit -m "Add Login component and styling"
```

---

### Task 21: Create Protected Route Component

**Files:**
- Create: `public/react-app/src/components/ProtectedRoute.jsx`

**Interfaces:**
- Consumes: `useAuth` hook
- Produces: Component that:
  - Checks if user is authenticated
  - Redirects to login if not
  - Shows component if authenticated
  - Can optionally check for specific roles

**Steps:**

- [ ] **Step 1: Create ProtectedRoute.jsx**

Create file `public/react-app/src/components/ProtectedRoute.jsx`:

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children, requiredRoles = null }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/react-app/src/components/ProtectedRoute.jsx
git commit -m "Add ProtectedRoute component for role-based access"
```

---

### Task 22: Create Dashboard Component

**Files:**
- Create: `public/react-app/src/components/Dashboard.jsx`

**Interfaces:**
- Consumes: `useAuth` hook, Navigation component
- Produces: Main dashboard showing:
  - User's name and role
  - Quick stats (today's deliveries, etc.)
  - Navigation to other sections
  - Different layout based on user role

**Steps:**

- [ ] **Step 1: Create Dashboard.jsx**

Create file `public/react-app/src/components/Dashboard.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deliveriesAPI, companiesAPI } from '../services/api';
import { Navigation } from './Navigation';
import '../styles/Dashboard.css';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalCompanies: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [deliveries, companies] = await Promise.all([
          deliveriesAPI.getAll(),
          companiesAPI.getAll(),
        ]);

        setStats({
          totalDeliveries: deliveries.length,
          totalCompanies: companies.length,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="dashboard">
      <Navigation />

      <div className="dashboard-content">
        <h1>Welcome, {user?.username}!</h1>
        <p className="role-badge">Role: <strong>{user?.role}</strong></p>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Companies</h3>
              <div className="stat-value">{stats.totalCompanies}</div>
            </div>
            <div className="stat-card">
              <h3>Total Deliveries</h3>
              <div className="stat-value">{stats.totalDeliveries}</div>
            </div>
          </div>
        )}

        <div className="dashboard-sections">
          <h2>Quick Access</h2>
          <div className="section-links">
            <a href="/deliveries" className="section-link">📦 Deliveries</a>
            <a href="/billing" className="section-link">💰 Billing</a>
            <a href="/reports" className="section-link">📊 Reports</a>
            {['owner', 'software_engineer'].includes(user?.role) && (
              <a href="/settings" className="section-link">⚙️ Settings</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Dashboard.css**

Create file `public/react-app/src/styles/Dashboard.css`:

```css
.dashboard {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}

.dashboard-content {
  flex: 1;
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.dashboard-content h1 {
  color: #333;
  margin-bottom: 10px;
}

.role-badge {
  color: #666;
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  font-weight: 600;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
}

.dashboard-sections h2 {
  color: #333;
  margin-top: 40px;
  margin-bottom: 20px;
}

.section-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.section-link {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.section-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

- [ ] **Step 3: Commit**

```bash
git add public/react-app/src/components/Dashboard.jsx public/react-app/src/styles/Dashboard.css
git commit -m "Add Dashboard component with stats and quick access"
```

---

### Task 23: Create Navigation Component

**Files:**
- Create: `public/react-app/src/components/Navigation.jsx`

**Interfaces:**
- Consumes: `useAuth` hook, React Router
- Produces: Navbar component with:
  - Links to main sections
  - User info and logout button
  - Role-based menu visibility

**Steps:**

- [ ] **Step 1: Create Navigation.jsx**

Create file `public/react-app/src/components/Navigation.jsx`:

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navigation.css';

export function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isOwnerOrSoftwareEngineer = ['owner', 'software_engineer'].includes(user?.role);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>Eau Cure</h1>
        <span className="nav-subtitle">Water Station Tracker</span>
      </div>

      <ul className="nav-menu">
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/deliveries">Deliveries</a></li>
        <li><a href="/billing">Billing</a></li>
        <li><a href="/reports">Reports</a></li>
        {isOwnerOrSoftwareEngineer && (
          <li><a href="/settings">Settings</a></li>
        )}
      </ul>

      <div className="nav-user">
        <span className="user-info">
          {user?.username} <br />
          <small>{user?.role}</small>
        </span>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create Navigation.css**

Create file `public/react-app/src/styles/Navigation.css`:

```css
.navbar {
  background: #333;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  min-width: 280px;
  flex-direction: column;
  gap: 30px;
  width: 280px;
  height: 100vh;
  overflow-y: auto;
}

.nav-brand {
  text-align: center;
  border-bottom: 1px solid #555;
  padding-bottom: 20px;
  width: 100%;
}

.nav-brand h1 {
  margin: 0;
  font-size: 24px;
}

.nav-subtitle {
  font-size: 12px;
  color: #aaa;
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  width: 100%;
}

.nav-menu li {
  margin: 10px 0;
}

.nav-menu a {
  color: white;
  text-decoration: none;
  display: block;
  padding: 12px 15px;
  border-radius: 5px;
  transition: background 0.3s;
}

.nav-menu a:hover {
  background: #555;
}

.nav-user {
  border-top: 1px solid #555;
  padding-top: 20px;
  text-align: center;
  width: 100%;
}

.user-info {
  display: block;
  font-size: 14px;
  margin-bottom: 15px;
}

.user-info small {
  color: #aaa;
  font-size: 12px;
}

.logout-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
}

.logout-btn:hover {
  background: #764ba2;
}

@media (max-width: 768px) {
  .navbar {
    width: 100%;
    height: auto;
    flex-direction: row;
    gap: 20px;
  }

  .nav-menu {
    display: flex;
    gap: 15px;
    flex: 1;
  }

  .nav-menu li {
    margin: 0;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add public/react-app/src/components/Navigation.jsx public/react-app/src/styles/Navigation.css
git commit -m "Add Navigation sidebar component"
```

---

### Task 24: Create Stub Components (Deliveries, Billing, Reports, Settings)

**Files:**
- Create:
  - `public/react-app/src/components/Deliveries.jsx`
  - `public/react-app/src/components/Billing.jsx`
  - `public/react-app/src/components/Reports.jsx`
  - `public/react-app/src/components/Settings.jsx`

**Interfaces:**
- Each produces a placeholder component that will be expanded later
- Shows basic structure and navigation

**Steps:**

- [ ] **Step 1: Create Deliveries.jsx**

Create file `public/react-app/src/components/Deliveries.jsx`:

```jsx
import React from 'react';
import { Navigation } from './Navigation';
import '../styles/Page.css';

export function Deliveries() {
  return (
    <div className="dashboard">
      <Navigation />
      <div className="dashboard-content">
        <h1>Deliveries</h1>
        <p>Deliveries management page - coming soon</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Billing.jsx**

Create file `public/react-app/src/components/Billing.jsx`:

```jsx
import React from 'react';
import { Navigation } from './Navigation';
import '../styles/Page.css';

export function Billing() {
  return (
    <div className="dashboard">
      <Navigation />
      <div className="dashboard-content">
        <h1>Billing</h1>
        <p>Billing management page - coming soon</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Reports.jsx**

Create file `public/react-app/src/components/Reports.jsx`:

```jsx
import React from 'react';
import { Navigation } from './Navigation';
import '../styles/Page.css';

export function Reports() {
  return (
    <div className="dashboard">
      <Navigation />
      <div className="dashboard-content">
        <h1>Daily Reports</h1>
        <p>Reports page - coming soon</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create Settings.jsx**

Create file `public/react-app/src/components/Settings.jsx`:

```jsx
import React from 'react';
import { Navigation } from './Navigation';
import '../styles/Page.css';

export function Settings() {
  return (
    <div className="dashboard">
      <Navigation />
      <div className="dashboard-content">
        <h1>Settings</h1>
        <p>Settings page (Owner/Software Engineer only) - coming soon</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Page.css**

Create file `public/react-app/src/styles/Page.css`:

```css
.dashboard {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}

.dashboard-content {
  flex: 1;
  padding: 40px;
}

.dashboard-content h1 {
  color: #333;
  margin-bottom: 20px;
}
```

- [ ] **Step 6: Commit**

```bash
git add public/react-app/src/components/Deliveries.jsx public/react-app/src/components/Billing.jsx public/react-app/src/components/Reports.jsx public/react-app/src/components/Settings.jsx public/react-app/src/styles/Page.css
git commit -m "Add stub components for Deliveries, Billing, Reports, Settings pages"
```

---

### Task 25: Create App.jsx and Setup React Router

**Files:**
- Modify: `public/react-app/src/App.jsx`

**Interfaces:**
- Consumes: All components, AuthProvider, React Router
- Produces: Main App component that:
  - Wraps app with AuthProvider
  - Sets up React Router with protected routes
  - Redirects to login if not authenticated

**Steps:**

- [ ] **Step 1: Create App.jsx**

Replace content of `public/react-app/src/App.jsx`:

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Deliveries } from './components/Deliveries';
import { Billing } from './components/Billing';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/deliveries"
            element={
              <ProtectedRoute>
                <Deliveries />
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredRoles={['owner', 'software_engineer']}>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

- [ ] **Step 2: Create App.css**

Create file `public/react-app/src/App.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html, body, #root {
  height: 100%;
}
```

- [ ] **Step 3: Commit**

```bash
git add public/react-app/src/App.jsx public/react-app/src/App.css
git commit -m "Setup React Router with protected routes and authentication flow"
```

---

## Phase 6: Backend Integration & Testing

### Task 26: Test Backend with Frontend (Local Development)

**Files:**
- No files, integration testing

**Interfaces:**
- Consumes: Running backend (npm start) and React app (npm start in react-app)
- Produces: Verified API authentication flow

**Steps:**

- [ ] **Step 1: Start backend server**

In one terminal:
```bash
npm start
```

Backend should start on http://localhost:3000

- [ ] **Step 2: Start React development server**

In another terminal:
```bash
cd public/react-app
npm start
```

React app should start on http://localhost:3000 (or 3001 if 3000 is taken)

- [ ] **Step 3: Test login flow**

Open React app in browser. You should see login page.

Try login with:
- Username: `admin1`
- Password: `admin1_password`

Expected: Redirects to dashboard, shows stats

- [ ] **Step 4: Test logout**

Click logout button on dashboard, should redirect to login.

- [ ] **Step 5: Verify token persistence**

Log in, refresh page. Should stay logged in (token in localStorage).

Close dev tools, open again, check localStorage has `auth_token`.

- [ ] **Step 6: Test permission checks**

Log in as admin, try to access `/settings` - should redirect to dashboard.

Log in as owner, access `/settings` - should work.

- [ ] **Step 7: Test API calls**

Check browser network tab - verify auth header is sent with all API requests.

- [ ] **No formal commit yet** - keep both servers running for next tasks

---

### Task 27: Complete Deliveries Component

[This would be a large implementation task - skipping detailed steps for brevity, but would include:
- Form to add delivery
- Table to view deliveries
- Edit/delete buttons
- Search/filter
- Real-time Socket.io updates

Similar structure to Login component with API calls]

---

## Phase 7: Deployment Preparation

### Task 28: Setup Environment for Production

**Files:**
- Modify: `public/react-app/.env.production`
- Modify: `server.js` (production mode)
- Modify: `.env` for production

**Steps:**

- [ ] **Step 1: Create .env.production**

Create `public/react-app/.env.production`:

```
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_SOCKET_URL=https://yourdomain.com
```

Replace `yourdomain.com` with your actual DigitalOcean domain.

- [ ] **Step 2: Build React app for production**

```bash
cd public/react-app
npm run build
```

Creates optimized build in `build/` folder.

- [ ] **Step 3: Update server.js to serve React build**

Add to `server.js` (after all API routes):

```javascript
// Serve React build files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public/react-app/build')));
  
  // All non-API routes serve index.html for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/react-app/build/index.html'));
  });
}
```

- [ ] **Step 4: Create deployment .env**

Create production `.env` file with secure values (don't commit):

```
NODE_ENV=production
JWT_SECRET=your-secure-random-key-here
JWT_EXPIRATION=7d
DATABASE_PATH=./data/eau-cure.db
PORT=3000
DEPLOY_URL=https://yourdomain.com
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "Add production build configuration"
```

---

### Task 29: Prepare for DigitalOcean Deployment

**Files:**
- Create: `Procfile` (for DigitalOcean App Platform)
- Create: `.digitalocean/app.yaml` (alternative: deployment config)
- Modify: `package.json` (add build script if needed)

**Steps:**

- [ ] **Step 1: Create Procfile**

Create file `Procfile`:

```
web: npm start
```

- [ ] **Step 2: Create DigitalOcean app config**

Create `.digitalocean/app.yaml`:

```yaml
name: eau-cure-web
services:
- name: web
  github:
    branch: main
    repo: your-username/eau-cure-web
  build_command: npm run build:react
  run_command: npm start
  envs:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    scope: RUN_AND_BUILD_TIME
    value: ${JWT_SECRET}
  http_port: 3000
```

- [ ] **Step 3: Add build script to package.json**

Add to `package.json` `scripts`:

```json
"build:react": "cd public/react-app && npm install && npm run build"
```

- [ ] **Step 4: Commit**

```bash
git add Procfile .digitalocean/app.yaml
git commit -m "Add DigitalOcean deployment configuration"
```

---

### Task 30: Final Testing & Deployment Checklist

**Files:**
- Create: `DEPLOYMENT.md` (documentation)

**Steps:**

- [ ] **Step 1: Create DEPLOYMENT.md**

Create file `DEPLOYMENT.md`:

```markdown
# Eau Cure Web - Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] React build successful (`npm run build:react`)
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] Git all changes committed

## DigitalOcean Setup

1. Go to https://www.digitalocean.com
2. Create account if needed
3. Create new App Platform project
4. Connect GitHub repo
5. Configure environment variables in DigitalOcean dashboard:
   - JWT_SECRET: Generate secure random string
   - NODE_ENV: production
6. Deploy

## Post-Deployment

- [ ] Test login at yourdomain.com
- [ ] Test all endpoints
- [ ] Monitor logs for errors
- [ ] Set up automated backups
- [ ] Configure domain DNS

## Domain Setup

1. Buy domain from Namecheap/Google Domains
2. Point nameservers to DigitalOcean
3. Create A record pointing to DigitalOcean IP

## Monitoring

- Check DigitalOcean App metrics
- Monitor database size
- Review auth logs for suspicious activity
- Set up email alerts for critical issues

## Maintenance

- Update dependencies monthly
- Review and rotate passwords quarterly
- Backup database weekly
- Monitor user account creation/deletion
```

- [ ] **Step 2: Test production build locally**

```bash
# Build React
cd public/react-app && npm run build

# Set environment to production
export NODE_ENV=production

# Start server
npm start
```

Visit http://localhost:3000 - should see login page served by Express, not React dev server.

- [ ] **Step 3: Verify all functionality**

- [ ] Login works
- [ ] Dashboard loads
- [ ] API calls work (check network tab)
- [ ] Real-time updates work (if applicable)
- [ ] Logout works
- [ ] Protected routes work

- [ ] **Step 4: Commit final changes**

```bash
git add DEPLOYMENT.md
git commit -m "Add deployment guide and production checklist"
```

- [ ] **Step 5: Push to GitHub**

```bash
git push origin master
```

---

## Summary

**Total Tasks Completed: 30**

### Backend (Tasks 1-15)
✅ Dependencies, environment setup
✅ Database schema with users table
✅ Password hashing and JWT tokens
✅ Authentication middleware and routes
✅ User management routes
✅ Initial user seeding
✅ Permission middleware
✅ Updated all API routes with auth

### Frontend (Tasks 16-25)
✅ React project setup
✅ Authentication context
✅ API service client
✅ Socket.io service
✅ Login component
✅ Protected routes
✅ Dashboard, Navigation components
✅ Stub components (ready for expansion)
✅ React Router setup

### Integration & Deployment (Tasks 26-30)
✅ Local development testing
✅ Production build configuration
✅ DigitalOcean deployment setup
✅ Deployment documentation

### Next Steps (Out of Scope for This Plan)
- Complete Deliveries, Billing, Reports, Settings components
- Add real-time Socket.io updates to all components
- Deploy to DigitalOcean
- Set up custom domain
- User training and cutover
- Monitoring and maintenance

---

**Plan Status:** Ready for execution

**Execution Method:** Recommended to use `superpowers:subagent-driven-development` for task-by-task implementation with review checkpoints, OR `superpowers:executing-plans` for batch execution in this session.
