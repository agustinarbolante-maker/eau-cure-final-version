const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'water_station.db');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      bottles_delivered INTEGER NOT NULL,
      bottles_returned INTEGER NOT NULL,
      dr_number TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Database table ready');
    }
  });
}

function getAllDeliveries(callback) {
  db.all(
    'SELECT * FROM deliveries ORDER BY timestamp DESC',
    (err, rows) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, rows || []);
      }
    }
  );
}

function addDelivery(company, bottlesDelivered, bottlesReturned, drNumber, callback) {
  db.run(
    'INSERT INTO deliveries (company, bottles_delivered, bottles_returned, dr_number) VALUES (?, ?, ?, ?)',
    [company, bottlesDelivered, bottlesReturned, drNumber],
    function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, { id: this.lastID });
      }
    }
  );
}

function updateDelivery(id, company, bottlesDelivered, bottlesReturned, drNumber, callback) {
  db.run(
    'UPDATE deliveries SET company = ?, bottles_delivered = ?, bottles_returned = ?, dr_number = ? WHERE id = ?',
    [company, bottlesDelivered, bottlesReturned, drNumber, id],
    (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}

function deleteDelivery(id, callback) {
  db.run(
    'DELETE FROM deliveries WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}

module.exports = {
  db,
  getAllDeliveries,
  addDelivery,
  updateDelivery,
  deleteDelivery
};
