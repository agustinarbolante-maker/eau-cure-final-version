# Eau Cure Web Transformation Design
**Date:** August 8, 2026  
**Status:** Design Approved  
**Author:** Claude Code + Agustino

---

## Executive Summary

Transform Eau Cure from a single-user Electron desktop application into a **multi-user React-based website** accessible from any browser. The application will support 5 users with role-based access control, real-time updates via Socket.io, and continue using SQLite for data persistence on a DigitalOcean server.

**Budget:** ~$80/year (DigitalOcean App Platform + domain)  
**Timeline:** ASAP  
**Primary Goal:** Enable Owner, Software Engineer, and 2 Admins to manage water station deliveries and billing simultaneously from different devices.

---

## Current State Analysis

**Existing Technology:**
- Electron desktop application (single machine only)
- Express.js backend with Node.js
- SQLite database (local file)
- Vanilla HTML/CSS/JavaScript frontend
- Socket.io for real-time event broadcasting
- Features: Companies management, Deliveries tracking, Billing, Daily reports, Calendar

**Limitations:**
- Only runs on one device
- No user authentication
- No multi-user support
- Data not accessible from anywhere

---

## Proposed Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────┐
│  React Frontend (Browser-based)             │
│  - Login page                               │
│  - Dashboard (role-based)                   │
│  - Deliveries, Billing, Reports, Settings  │
│  - Real-time Socket.io updates              │
└────────────┬────────────────────────────────┘
             │ HTTP + WebSocket
             │
┌────────────▼────────────────────────────────┐
│  Express.js Backend                         │
│  - REST API endpoints                       │
│  - JWT authentication                       │
│  - Role-based permission checks             │
│  - Socket.io real-time broadcasting         │
│  - Business logic (billing, deliveries)     │
└────────────┬────────────────────────────────┘
             │ File-based (local)
             │
┌────────────▼────────────────────────────────┐
│  SQLite Database                            │
│  - Users, Companies, Deliveries, Billing    │
│  - Local file storage on server             │
└─────────────────────────────────────────────┘
```

---

## User Roles & Permissions

### 1. Owner
- **Permissions:** Full access to all features
- **Capabilities:**
  - Create/delete/modify user accounts
  - View and modify company settings
  - Access all delivery history and billing data
  - Generate reports

### 2. Software Engineer
- **Permissions:** Same as Owner (full access)
- **Capabilities:**
  - Create/delete/modify user accounts
  - View and modify company settings
  - Access all delivery history and billing data
  - Generate reports

### 3. Admin (2 users)
- **Permissions:** Limited administrative access
- **Capabilities:**
  - Add, edit, view all deliveries
  - Access company settings (view and modify)
  - Generate and view billing reports
  - Access all historical delivery data
  - View customer companies
- **Restrictions:**
  - **Cannot** create or delete user accounts
  - **Cannot** modify user roles
  - **Cannot** delete companies

---

## Frontend (React) Structure

### Pages & Components

**1. Login Page**
- Username/password input
- Form validation
- Error messages for failed login attempts
- Stores auth token in browser localStorage

**2. Dashboard**
- Overview of recent deliveries
- Quick stats (deliveries today, pending billing, etc.)
- Navigation to other sections
- Layout adapts based on user role

**3. Deliveries Page**
- List of all deliveries with search/filter
- Add new delivery form
- Edit existing deliveries
- View delivery details
- Export capability

**4. Billing Page**
- View billing reports by company
- Payment status tracking
- Invoice history
- Generate billing summaries

**5. Daily Reports**
- Calendar view (existing feature preserved)
- Daily summary statistics
- Report generation

**6. Company Management** (Owner/Software Engineer only)
- Add/edit company information
- Manage company list
- Unit pricing settings

**7. Settings Page** (Owner/Software Engineer only)
- User account management (create, delete, modify roles)
- Company-wide settings
- System configuration

**8. Navigation Bar**
- Display current user's name and role
- Logout button
- Link to Dashboard
- Links to accessible pages based on role

### State Management
- Use **React Context API** to manage:
  - Current logged-in user (name, role, permissions)
  - Company data
  - Deliveries
  - Real-time updates from Socket.io
- Alternative: Redux if complexity grows

### Real-Time Updates
- Socket.io listener continuously connected
- Updates React state when:
  - New deliveries added
  - Billing information changes
  - Companies modified
  - Other users make changes

---

## Backend (Express.js) Changes

### Authentication Endpoints

**POST /api/auth/login**
- Input: username, password
- Output: JWT token, user info
- Sets secure token with expiration (7 days default)

**POST /api/auth/logout**
- Clears session

**GET /api/auth/me**
- Returns current logged-in user info
- Protected endpoint (requires valid token)

### User Management Endpoints (Owner/Software Engineer only)

**POST /api/users**
- Create new user account
- Input: username, email, password, role
- Accessible: Owner, Software Engineer only

**DELETE /api/users/:id**
- Delete user account
- Accessible: Owner, Software Engineer only

**PUT /api/users/:id/role**
- Change user's role
- Accessible: Owner, Software Engineer only

**GET /api/users**
- List all users (with roles)
- Accessible: Owner, Software Engineer only

### Existing Endpoints (Enhanced with Auth)

**GET /api/companies**
- All users can view (Admins can modify)

**POST /api/companies**
- Add company (Admins+ only)

**PUT /api/companies/:id**
- Edit company (Admins+ only)

**GET /api/deliveries**
- All users can view

**POST /api/deliveries**
- Add delivery (Admins+ only)

**PUT /api/deliveries/:id**
- Edit delivery (Admins+ only)

**GET /api/billing/:company**
- View billing (Admins+ only)

### Security Implementation

**JWT Authentication**
- User logs in → receives JWT token
- Token stored in browser localStorage
- Token included in Authorization header for all subsequent API requests
- Backend validates token before processing any request

**Permission Middleware**
- Every endpoint checks user role before allowing access
- Example: Only Owner/Software Engineer can delete users
- Example: Admins can add deliveries but cannot delete companies

**Socket.io Authentication**
- Only authenticated users receive real-time updates
- Connection verified on each emit

---

## Database Schema (SQLite)

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- 'owner', 'software_engineer', 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Companies Table (existing, enhanced)
```sql
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  unit_price REAL NOT NULL,
  contact TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Deliveries Table (existing, enhanced with user tracking)
```sql
CREATE TABLE deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_by INTEGER NOT NULL, -- User ID who logged this
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Billing Table (existing)
```sql
CREATE TABLE billing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  total_amount REAL NOT NULL,
  paid BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

---

## Authentication Flow

1. **User navigates to website** → React Login page loads
2. **User enters credentials** → Username & password submitted to `/api/auth/login`
3. **Backend validates** → Checks database, verifies password
4. **Token returned** → JWT token sent back to React
5. **Token stored** → React stores in localStorage
6. **Redirect to Dashboard** → React app loads with authenticated user
7. **All API requests** → Include token in Authorization header
8. **Backend verifies token** → Middleware checks validity before processing
9. **Real-time connection** → Socket.io connects with authenticated session

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+ |
| State Management | React Context API (or Redux) |
| Real-time | Socket.io client |
| Backend | Node.js + Express.js |
| Authentication | JWT (JSON Web Tokens) |
| Database | SQLite3 |
| Hosting | DigitalOcean App Platform |
| Version Control | GitHub |
| Build Tools | Webpack/Vite (for React bundling) |

---

## Deployment Strategy

### DigitalOcean App Platform

**Setup:**
1. Create GitHub repository and push code
2. Connect GitHub to DigitalOcean App Platform
3. DigitalOcean automatically deploys on push
4. Configure environment variables (JWT secret, PORT, etc.)
5. Point domain to DigitalOcean URL

**What Gets Deployed:**
- React frontend (built as static files)
- Express backend (Node.js app)
- SQLite database (file on server)

**Cost Breakdown:**
- DigitalOcean App Platform: ~$60-70/year
- Domain name: ~$12/year
- **Total: ~$82/year**

**Backup & Maintenance:**
- Implement automated SQLite backups (daily)
- Store backups in DigitalOcean Spaces or GitHub
- Monitor app health and logs

---

## Migration Plan from Electron to Web

### Phase 1: Backend Preparation
- Add JWT authentication to Express
- Add user/role permission middleware
- Add users table to SQLite
- Test all existing API endpoints with new auth

### Phase 2: Frontend Rebuild (React)
- Build React login page
- Rebuild dashboard component
- Migrate all existing pages to React components
- Implement role-based access control (show/hide UI based on role)
- Connect to Socket.io

### Phase 3: Testing
- Test login flow
- Test role-based permissions (admin can't create users, etc.)
- Test real-time updates
- Test on mobile browsers
- Load testing with simulated users

### Phase 4: Deployment
- Set up GitHub repository
- Configure DigitalOcean App Platform
- Deploy to production
- Set up domain
- Initial data migration (existing companies/deliveries)

### Phase 5: User Training & Cutover
- Train Owner, Admins on new system
- Migrate existing data
- Retire Electron desktop app

---

## Data Migration Strategy

**Existing Data:**
- Current companies and deliveries in SQLite will be preserved
- Migrate to web database without data loss

**Initial Users:**
- Manually create 4 user accounts:
  - 1 Owner
  - 1 Software Engineer (Agustino)
  - 2 Admins
- Send login credentials to each user

---

## Security Considerations

1. **Password Storage:** All passwords hashed with bcrypt (not stored as plaintext)
2. **HTTPS/SSL:** All traffic encrypted in transit
3. **Token Expiration:** JWT tokens expire after 7 days (users re-login)
4. **Role-Based Access:** Backend validates every request, not just frontend
5. **SQLite Encryption:** Consider SQLite encryption for sensitive data
6. **Environment Variables:** Sensitive values (JWT secret, database path) in env files, not in code
7. **Input Validation:** All user inputs validated/sanitized before database operations
8. **Rate Limiting:** Optional - add rate limiting to prevent brute force attacks on login

---

## Success Criteria

✅ **Functional:**
- Users can log in with username/password
- Owner and Software Engineer can create/delete users
- Admins can add and view deliveries without creating users
- Real-time updates work (multiple users see changes immediately)
- All existing features (billing, reports, calendar) work as before

✅ **Performance:**
- Page loads in < 3 seconds
- Real-time updates within 1 second
- Handles 5 concurrent users smoothly

✅ **Reliability:**
- 99% uptime
- Daily automated backups
- No data loss

✅ **Usability:**
- Works on desktop and mobile browsers
- Responsive design
- Clear navigation

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| SQLite performance issues with 5 concurrent users | Start with SQLite, monitor, upgrade to PostgreSQL if needed |
| Data loss during migration | Run backup before cutover, test restoration |
| User confusion with new web interface | Provide training, keep UI similar to Electron app |
| Token/auth bugs causing lockout | Implement password reset flow, maintain backup admin account |

---

## Future Enhancements (Out of Scope)

- Mobile native app (iOS/Android)
- Advanced analytics and AI-driven insights
- Multiple locations/branches support
- Integration with third-party water suppliers
- Payment gateway integration
- SMS notifications for deliveries
- Database migration to PostgreSQL if scaling is needed

---

## Approval

- **Design Approved By:** Agustino
- **Date Approved:** August 8, 2026
- **Next Step:** Implementation planning via writing-plans skill
