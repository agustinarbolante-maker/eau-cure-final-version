const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get('/api/companies', async (req, res) => {
  try {
    const companies = await db.getAllCompaniesFromDB();
    res.json(companies.map(c => c.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/companies/all', async (req, res) => {
  try {
    const companies = await db.getAllCompaniesFromDB();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies', async (req, res) => {
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

app.get('/api/billing/:company', async (req, res) => {
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

app.post('/api/billing-statements', async (req, res) => {
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

app.get('/api/billing-statements', async (req, res) => {
  try {
    const statements = await db.getAllBillingStatements();
    res.json(statements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/billing-statements/:id', async (req, res) => {
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

app.delete('/api/billing-statements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteBillingStatement(id);
    res.json({ message: 'Billing statement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/deliveries', async (req, res) => {
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

app.post('/api/deliveries', async (req, res) => {
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

app.put('/api/deliveries/:id', async (req, res) => {
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

app.delete('/api/deliveries/:id', async (req, res) => {
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

app.get('/api/deliveries/export/csv', async (req, res) => {
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

app.get('/api/backups', async (req, res) => {
  try {
    const backups = await db.listBackups();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups', async (req, res) => {
  try {
    const result = await db.performBackup();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups/restore/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await db.restoreBackup(filename);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups/download/:filename', (req, res) => {
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
