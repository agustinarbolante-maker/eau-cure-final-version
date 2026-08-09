const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;

// Configure multer for backup uploads
const uploadsDir = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.db')) {
      return cb(new Error('Only .db files are allowed'));
    }
    cb(null, true);
  }
});

app.use(cors());
app.use(bodyParser.json());

// Serve React app build if it exists (at root path)
const reactBuildPath = path.join(__dirname, 'public', 'react-app', 'build');
const reactIndexPath = path.join(reactBuildPath, 'index.html');

if (fs.existsSync(reactBuildPath)) {
  // Serve React static files
  app.use(express.static(reactBuildPath, { maxAge: '1d', etag: false }));
} else {
  // Fallback: serve old public folder
  app.use(express.static(path.join(__dirname, 'public')));
}

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { requireAdminOrHigher } = require('./middleware/permissions');

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Companies API (all can view, admin+ can create/edit)
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const companies = await db.getAllCompaniesFromDB();
    res.json(companies.map(c => c.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/companies/all', authenticateToken, async (req, res) => {
  try {
    const companies = await db.getAllCompaniesFromDB();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { name, unitPrice } = req.body;
    if (!name || unitPrice === undefined) {
      return res.status(400).json({ error: 'Name and unit price are required' });
    }
    const id = await db.addCompany(name, unitPrice);
    const companies = await db.getAllCompaniesFromDB();
    io.emit('companies_updated', companies);
    res.json({ id, name, unitPrice, message: 'Company added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/companies/:name', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { name } = req.params;
    const { unitPrice } = req.body;
    if (unitPrice === undefined) {
      return res.status(400).json({ error: 'Unit price is required' });
    }
    await db.updateCompanyPrice(name, unitPrice);
    const companies = await db.getAllCompaniesFromDB();
    io.emit('companies_updated', companies);
    res.json({ message: 'Company price updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/:company', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { company } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const deliveries = await db.getBillingStatement(company, startDate, endDate);
    const unitPrice = await db.getCompanyPrice(company);

    res.json({ company, unitPrice, deliveries, startDate, endDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing-statements', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { company, startDate, endDate, totalAmount } = req.body;

    if (!company || !startDate || !endDate || totalAmount === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const id = await db.saveBillingStatement(company, startDate, endDate, totalAmount);
    res.json({ id, message: 'Billing statement saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing-statements', authenticateToken, async (req, res) => {
  try {
    const statements = await db.getAllBillingStatements();
    res.json(statements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/billing-statements/:id', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid } = req.body;

    if (isPaid === undefined) {
      return res.status(400).json({ error: 'isPaid field is required' });
    }

    await db.updateBillingStatementStatus(id, isPaid);
    res.json({ message: 'Billing statement updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/billing-statements/:id', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteBillingStatement(id);
    res.json({ message: 'Billing statement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/deliveries', authenticateToken, async (req, res) => {
  try {
    const { company, startDate, endDate } = req.query;

    let deliveries;
    if (company || startDate || endDate) {
      deliveries = await db.getDeliveriesByFilters(company, startDate, endDate);
    } else {
      deliveries = await db.getAllDeliveries();
    }

    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await db.getStats(startDate, endDate);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/companies', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await db.getCompanyStats(startDate, endDate);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/deliveries', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { company, bottlesDelivered, bottlesReturned, drNumber, timestamp } = req.body;

    if (!company || bottlesDelivered === undefined || bottlesReturned === undefined || !drNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const id = await db.addDelivery(company, bottlesDelivered, bottlesReturned, drNumber, timestamp);
    const deliveries = await db.getAllDeliveries();
    io.emit('deliveries_updated', deliveries);
    res.json({ id, message: 'Delivery added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/deliveries/:id', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { id } = req.params;
    const { company, bottlesDelivered, bottlesReturned, drNumber } = req.body;

    if (!company || bottlesDelivered === undefined || bottlesReturned === undefined || !drNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await db.updateDelivery(id, company, bottlesDelivered, bottlesReturned, drNumber);
    const deliveries = await db.getAllDeliveries();
    io.emit('deliveries_updated', deliveries);
    res.json({ message: 'Delivery updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/deliveries/:id', authenticateToken, requireAdminOrHigher, async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteDelivery(id);
    const deliveries = await db.getAllDeliveries();
    io.emit('deliveries_updated', deliveries);
    res.json({ message: 'Delivery deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/deliveries/export/csv', authenticateToken, async (req, res) => {
  try {
    const { company, startDate, endDate } = req.query;

    let deliveries;
    if (company || startDate || endDate) {
      deliveries = await db.getDeliveriesByFilters(company, startDate, endDate);
    } else {
      deliveries = await db.getAllDeliveries();
    }

    const csv = [
      ['ID', 'Company', 'Bottles Delivered', 'Bottles Returned', 'DR Number', 'Timestamp'].join(','),
      ...deliveries.map(d => [
        d.id,
        `"${d.company}"`,
        d.bottles_delivered,
        d.bottles_returned,
        `"${d.dr_number}"`,
        new Date(d.timestamp).toLocaleString()
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="deliveries_' + new Date().toISOString().split('T')[0] + '.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups', authenticateToken, async (req, res) => {
  try {
    const backups = await db.listBackups();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups', authenticateToken, async (req, res) => {
  try {
    const result = await db.performBackup();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups/restore/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await db.restoreBackup(filename);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups/download/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, 'data', 'backups', filename);

    if (!filename.startsWith('backup_') || !filename.endsWith('.db')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    if (!require('fs').existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.download(backupPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/backups/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, 'data', 'backups', filename);

    if (!filename.startsWith('backup_') || !filename.endsWith('.db')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const fs = require('fs');
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    fs.unlinkSync(backupPath);
    res.json({ message: 'Backup deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFilePath = path.join(uploadsDir, req.file.filename);
    const backupDir = path.join(__dirname, 'data', 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate unique filename to avoid overwriting
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFilename = `backup_${timestamp}_uploaded.db`;
    const targetPath = path.join(backupDir, backupFilename);

    // Copy the uploaded file to backups directory
    fs.copyFileSync(uploadedFilePath, targetPath);

    // Clean up the temporary upload file
    fs.unlinkSync(uploadedFilePath);

    res.json({
      message: 'Backup uploaded and restored successfully',
      filename: backupFilename
    });
  } catch (err) {
    // Clean up the uploaded file on error
    if (req.file) {
      const uploadedFilePath = path.join(uploadsDir, req.file.filename);
      if (fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    }
    res.status(500).json({ error: err.message });
  }
});

// Authentication and user management routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Make io available to routes
app.set('io', io);

// SPA routing catch-all - MUST BE AT THE END after all API routes
if (fs.existsSync(reactBuildPath)) {
  app.get('*', (req, res) => {
    res.sendFile(reactIndexPath, (err) => {
      if (err) {
        res.status(500).send('Error loading React app');
      }
    });
  });
}

async function start() {
  try {
    await db.initDB();
    console.log('Database initialized');

    await db.performBackup();
    console.log('Initial backup created');

    setInterval(async () => {
      try {
        await db.performBackup();
      } catch (err) {
        console.error('Scheduled backup failed:', err);
      }
    }, 24 * 60 * 60 * 1000);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
