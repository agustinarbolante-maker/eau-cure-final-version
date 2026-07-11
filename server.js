const express = require('express');
const path = require('path');
const cors = require('cors');
const {
  getAllDeliveries,
  addDelivery,
  updateDelivery,
  deleteDelivery
} = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/deliveries', (req, res) => {
  getAllDeliveries((err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/deliveries', (req, res) => {
  const { company, bottlesDelivered, bottlesReturned, drNumber } = req.body;

  if (!company || bottlesDelivered === undefined || bottlesReturned === undefined || !drNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  addDelivery(company, bottlesDelivered, bottlesReturned, drNumber, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json(result);
    }
  });
});

app.put('/api/deliveries/:id', (req, res) => {
  const { id } = req.params;
  const { company, bottlesDelivered, bottlesReturned, drNumber } = req.body;

  if (!company || bottlesDelivered === undefined || bottlesReturned === undefined || !drNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  updateDelivery(id, company, bottlesDelivered, bottlesReturned, drNumber, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.delete('/api/deliveries/:id', (req, res) => {
  const { id } = req.params;

  deleteDelivery(id, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Eau Cure server running on http://localhost:${PORT}`);
});
