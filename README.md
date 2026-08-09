# 💧 Eau Cure - Water Station Delivery Tracker

A professional web application for managing water station deliveries, companies, billing, and financial reports.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm

### Installation
```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

### Default Login Credentials
| Role | Username | Password |
|------|----------|----------|
| Owner | `Olimar` | `Olimar123` |
| Admin | `Admin` | `Admin123` |

---

## ✨ Features

### 📊 Dashboard
- Real-time earnings summary (Today, This Week, Last Week, This Month, All Time)
- Delivery trends chart (7-day view)
- Company statistics overview
- Live updates via Socket.io

### 🚚 Deliveries
- Add, edit, and delete delivery records
- Calendar date picker
- DR number tracking
- Bottles delivered/returned tracking
- Notes field for additional details

### 📋 Records
- **Delivery History**: Browse all deliveries with date range filtering
- **Delivery Reports**: Generate detailed reports with company filtering
- Export to PDF and Excel formats
- Professional invoice-style formatting

### 🏢 Companies
- Add new companies with unit pricing
- Edit company information
- View company statistics (deliveries, bottles, earnings)
- Delete companies (cascade deletes associated deliveries)
- 56 pre-seeded companies included

### 💰 Billing
- Create billing statements for company and date range
- Auto-calculate from delivery data
- Toggle payment status (Paid/Unpaid)
- Export statements to PDF and Excel
- Professional billing statement format

### 👥 User Management
- Multi-user authentication (Owner, Admin, Software Engineer roles)
- Secure JWT-based sessions
- Role-based access control

---

## 📁 Project Structure

```
eau-cure-final-version/
├── server.js              # Express server & API endpoints
├── database.js            # SQLite database functions
├── public/
│   ├── index.html         # Main UI (vanilla HTML/CSS/JS)
│   ├── app.js             # Frontend logic
│   └── styles.css         # Styling
├── data/
│   ├── water_station.db   # SQLite database (auto-created)
│   └── backups/           # Automatic backups
├── docs/
│   ├── guides/            # Feature guides
│   ├── deployment/        # Deployment instructions
│   └── archive/           # Previous session documentation
└── package.json           # Dependencies
```

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (no frameworks)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt for password hashing
- **Export**: SheetJS (Excel), jsPDF (PDF)
- **Charts**: Chart.js

---

## 📊 Database

### Tables
- `users` - User accounts with roles
- `companies` - Company information with unit pricing
- `deliveries` - Individual delivery records
- `billing_statements` - Billing invoices

### Automatic Backups
- Created automatically on server startup
- Stored in `data/backups/`
- Last 30 days retained
- Can restore from any backup point

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)

### Deliveries
- `GET /api/deliveries` - Get all deliveries
- `POST /api/deliveries` - Create delivery
- `PUT /api/deliveries/:id` - Update delivery
- `DELETE /api/deliveries/:id` - Delete delivery

### Companies
- `GET /api/companies` - Get company names
- `GET /api/companies/all` - Get all companies with details
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Billing
- `GET /api/billing-statements` - Get all statements
- `POST /api/billing-statements` - Create statement
- `GET /api/billing-statements/:id` - Get statement by ID
- `PUT /api/billing-statements/:id` - Update statement status

---

## 📈 Deployment

### Option A: DigitalOcean (Recommended)
**Cost**: $11/month ($6 Droplet + $5 Spaces backup)
- See `docs/deployment/digitalocean-setup.md`

### Option B: Render / Railway
**Cost**: Free tier available
- Quick deployment from GitHub
- Automatic backups

---

## 📚 Documentation

- **[Feature Guides](docs/guides/)** - How to use each feature
- **[Testing Guide](docs/guides/TESTING_GUIDE.md)** - Test all features
- **[Session Archive](docs/archive/)** - Previous session notes

---

## 🔒 Security Features

- ✅ JWT authentication with expiring tokens
- ✅ bcrypt password hashing (10 rounds)
- ✅ Role-based access control (Owner, Admin, Software Engineer)
- ✅ Automatic database backups (30-day retention)
- ✅ Protected API endpoints with token validation

---

## 💡 Key Statistics

- **Companies**: 56 pre-seeded
- **Deliveries**: Unlimited tracking
- **Database**: SQLite3 with auto-backups
- **Users**: Multi-user support with roles
- **Exports**: PDF & Excel formats

---

## 📝 Earnings Calculation

**Formula**: `Deliveries × Unit Price = Earnings`

Example:
- Company: Arkray
- Deliveries: 10 bottles
- Unit Price: ₱18
- Earnings: ₱180

Tracked across: Today, This Week, Last Week, This Month, All Time

---

## 🚀 Getting Started for Production

1. **Push to GitHub** (already done)
2. **Choose Hosting**: DigitalOcean, Render, or Railway
3. **Set Environment Variables**: See deployment guide
4. **Deploy**: Follow hosting-specific instructions
5. **Verify**: Test all features in production
6. **Backup Strategy**: Enable automatic backups

---

## 📞 Support

For issues or questions:
1. Check `docs/guides/` for feature documentation
2. Review API endpoints in server.js
3. Check database.js for data functions

---

## 📄 License

Proprietary - Eau Cure Water Station System

---

**Last Updated**: 2026-08-09  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
