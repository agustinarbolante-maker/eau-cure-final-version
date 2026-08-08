# Eau Cure - Testing & Deployment Guide

**Status:** Full Stack Ready for Testing ✅

---

## 🚀 Quick Start (5 Minutes)

### 1. Terminal 1: Start Backend
```bash
npm start
```
Expected: `Server running on http://localhost:3000`

### 2. Terminal 2: Start React Frontend
```bash
cd public/react-app
npm start
```
Expected: React opens on http://localhost:3000 (or 3001)

### 3. Browser: Test Login
- Navigate to http://localhost:3001 (or wherever React is running)
- Login with:
  - **Username:** admin1
  - **Password:** admin1_password
- Expected: Redirects to Dashboard, shows user info

---

## 🧪 Testing Scenarios

### Scenario 1: Admin Login
**Steps:**
1. Go to login page
2. Enter: admin1 / admin1_password
3. Click Login

**Expected Result:**
- ✅ Login succeeds
- ✅ Redirected to dashboard
- ✅ Shows "Welcome, admin1!"
- ✅ Shows role: "admin"

### Scenario 2: Owner Login
**Steps:**
1. Go to login page
2. Enter: owner / owner_password
3. Click Login

**Expected Result:**
- ✅ Login succeeds
- ✅ Dashboard shows owner role
- ✅ "Admin Panel" section appears (owners see this)

### Scenario 3: Software Engineer Login
**Steps:**
1. Go to login page
2. Enter: agustino / software_engineer_password
3. Click Login

**Expected Result:**
- ✅ Login succeeds
- ✅ Dashboard shows software_engineer role
- ✅ "Admin Panel" section appears

### Scenario 4: Token Persistence
**Steps:**
1. Login as admin1
2. Refresh page (F5)
3. Should stay logged in

**Expected Result:**
- ✅ Still on dashboard
- ✅ Still shows logged in user
- ✅ Token stored in localStorage

### Scenario 5: Logout
**Steps:**
1. Login as admin1
2. Click "Logout" button
3. Check if redirected to login

**Expected Result:**
- ✅ Redirected to login page
- ✅ Token removed from localStorage
- ✅ Must login again to access dashboard

### Scenario 6: Invalid Login
**Steps:**
1. Go to login page
2. Enter: admin1 / wrongpassword
3. Click Login

**Expected Result:**
- ✅ Shows error: "Invalid username or password"
- ✅ Stays on login page
- ✅ Input fields still visible

### Scenario 7: Protected Route
**Steps:**
1. Logout (if logged in)
2. Try to go directly to http://localhost:3001/dashboard
3. Should redirect to login

**Expected Result:**
- ✅ Redirects to login page
- ✅ Cannot access dashboard without auth

---

## 📱 Testing the Backend API (Postman)

### Test Login Endpoint
```
POST http://localhost:3000/api/auth/login

Body (JSON):
{
  "username": "admin1",
  "password": "admin1_password"
}

Expected Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 3,
    "username": "admin1",
    "email": "admin1@eaucure.com",
    "role": "admin"
  },
  "message": "Login successful"
}
```

### Test Get Current User
```
GET http://localhost:3000/api/auth/me

Headers:
Authorization: Bearer <token_from_login>

Expected Response:
{
  "id": 3,
  "username": "admin1",
  "email": "admin1@eaucure.com",
  "role": "admin"
}
```

### Test Get All Users (Owner Only)
```
GET http://localhost:3000/api/users

Headers:
Authorization: Bearer <owner_or_software_engineer_token>

Expected Response:
[
  {
    "id": 1,
    "username": "owner",
    "email": "owner@eaucure.com",
    "role": "owner",
    "created_at": "2026-08-08..."
  },
  ...
]
```

### Test Permission Denied (Admin tries to create user)
```
POST http://localhost:3000/api/users

Headers:
Authorization: Bearer <admin_token>

Body:
{
  "username": "test",
  "email": "test@example.com",
  "password": "pass",
  "role": "admin"
}

Expected Response (403 Forbidden):
{
  "error": "Insufficient permissions",
  "requiredRoles": ["owner", "software_engineer"],
  "userRole": "admin"
}
```

---

## 🐛 Troubleshooting

### "Cannot find module" Error
**Solution:** Make sure you're in the correct directory
```bash
# For backend
cd /path/to/Eau-Cure-Final-Version
npm start

# For frontend
cd /path/to/Eau-Cure-Final-Version/public/react-app
npm start
```

### "Connection refused" on Login
**Solution:** Make sure backend is running
```bash
# In terminal 1
npm start
# Should show: Server running on http://localhost:3000
```

### React app stuck on loading
**Solution:** Check browser console for errors
- Open DevTools (F12)
- Go to Console tab
- Look for errors related to backend connection

### "Invalid token" error after login
**Solution:** Backend/frontend version mismatch
- Make sure you're using latest code from master branch
- Clear browser cache (Ctrl+Shift+Delete)
- Logout and login again

---

## 📊 What's Working

✅ **Backend (Express)**
- JWT authentication
- User management (CRUD)
- Role-based permissions
- Password hashing
- Database integration

✅ **Frontend (React)**
- Login page with validation
- Authentication context
- Protected routes
- Dashboard with user info
- Logout functionality
- Token persistence

✅ **Database (SQLite)**
- Users table with roles
- 4 initial users created
- Password hashing verified

---

## 🚢 Next Steps for Deployment

### Step 1: Build React for Production
```bash
cd public/react-app
npm run build
```
Creates optimized build in `public/react-app/build/`

### Step 2: Update Backend to Serve React Build
Already set up in `server.js` - see `if (process.env.NODE_ENV === 'production')`

### Step 3: Deploy to DigitalOcean
1. Push to GitHub
2. Create DigitalOcean App Platform project
3. Connect GitHub repo
4. Set environment variables
5. Deploy

See `docs/superpowers/plans/...` for detailed deployment instructions.

---

## 🎯 Remaining Frontend Work (Optional)

These components are still stubs and can be built incrementally:

- **Deliveries Page:** Add delivery form, list, edit, delete
- **Billing Page:** View billing data, generate reports
- **Reports Page:** Daily statistics, charts
- **Settings Page:** User management (admin only)

All components follow the same pattern:
1. Create component
2. Add CSS styling
3. Connect to API
4. Add Socket.io for real-time updates

---

## 📞 Quick Reference

**Test Accounts:**
```
OWNER
  Username: owner
  Password: owner_password

SOFTWARE ENGINEER
  Username: agustino
  Password: software_engineer_password

ADMIN 1
  Username: admin1
  Password: admin1_password

ADMIN 2
  Username: admin2
  Password: admin2_password
```

**Important URLs:**
```
Backend: http://localhost:3000
Frontend: http://localhost:3001 (or 3000)
API Login: POST http://localhost:3000/api/auth/login
React App: http://localhost:3001 (browser)
```

**Files to Know:**
```
Backend Entry: server.js
Backend Routes: routes/auth.js, routes/users.js
Frontend Entry: public/react-app/src/App.jsx
Auth Logic: public/react-app/src/contexts/AuthContext.jsx
Database: database.js
```

---

**Status:** ✅ Ready for testing and deployment!
