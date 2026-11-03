const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'data', 'water_station.db');
const BACKUP_DIR = path.join(__dirname, 'data', 'backups');
const BACKUP_RETENTION_DAYS = 30;

let db;

// Fixed list shown in the Expenses dropdown; the server rejects anything else
const EXPENSE_CATEGORIES = [
  'Electricity',
  'Water',
  'Fuel',
  'Salaries and Wages',
  'Oil, Lubricants, etc.',
  'Vehicle Repair and Maintenance',
  'Salt',
  'Filters',
  'Seals',
  'Bottles',
  'Dispensers',
  'Other water station supplies',
  'Office Supplies',
  'Store Repair and Maintenance',
  'Others'
];

const COMPANIES = [
  'HRD', 'HRD Canteen', 'I-Cube', 'Exterior', 'I-Cube 1st Floor Pantry',
  'HRD Logistics', 'DHR', 'DHR Logistics', 'Majestic', 'Majestic Energy Corp.',
  'Batching', 'CFD', 'CEZ 2', 'HTI', 'SCAD 5th Factory', 'SCAD', 'PV Tech',
  'WUKONG Expansion', 'Wukong 4th factory', 'Wukong Plastic Moulding',
  'Wukong Prep 4.0', 'Wukong Sawmill', 'Wukong CEZ 2 Warehouse Majestic',
  'Wukong Steel Majestic', 'MEC', 'Castem', 'Itabashi', 'S&S Phils',
  'Seintogether', 'Danam', 'Danam Canteen', 'Danam T', 'Danam Warehouse',
  'Wyntron', 'Wyntron Canteen', 'Wyntron Warehouse', 'Wyntron Stafhouse',
  'PVi', 'PVI Canteen', 'DKP', 'DKP Canteen', 'Dyna', 'Santech Neomax 1',
  'Santech Neomax 2', 'Santech Thermal', 'Santech Admin', 'Santech STAP',
  'Santech STAA', 'YKY', 'NX Logistics', 'YM Tech', 'Arkray', 'EN',
  'Warehouse Management', 'RCBC', 'GOLDRICH'
];

function initDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        db.run(`
          CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            unit_price REAL NOT NULL
          )
        `, (err1) => {
          if (err1) {
            reject(err1);
          } else {
            db.run(`
              CREATE TABLE IF NOT EXISTS deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT NOT NULL,
                bottles_delivered INTEGER NOT NULL,
                bottles_returned INTEGER NOT NULL,
                dr_number TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err2) => {
              if (err2) {
                reject(err2);
              } else {
                initBillingStatementsTable().then(() => createUserTable()).then(() => initExpensesTable()).then(() => seedCompanies()).then(() => seedDefaultUsers()).then(() => resolve()).catch(reject);
              }
            });
          }
        });
      }
    });
  });
}

function initBillingStatementsTable() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS billing_statements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        is_paid INTEGER DEFAULT 0,
        invoice_number TEXT DEFAULT NULL,
        created_date TEXT DEFAULT CURRENT_TIMESTAMP,
        paid_date TEXT
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function initExpensesTable() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_date TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) return reject(err);
      db.run('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (expense_date)', (err2) => {
        if (err2) reject(err2);
        else resolve();
      });
    });
  });
}

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

function seedCompanies() {
  const companyData = [
    { name: 'HRD', price: 17 }, { name: 'HRD Canteen', price: 17 }, { name: 'I-Cube', price: 17 },
    { name: 'Exterior', price: 17 }, { name: 'I-Cube 1st Floor Pantry', price: 17 },
    { name: 'HRD Logistics', price: 17 }, { name: 'DHR', price: 17 }, { name: 'DHR Logistics', price: 17 },
    { name: 'Majestic', price: 17 }, { name: 'Majestic Energy Corp.', price: 17 },
    { name: 'Batching', price: 17 }, { name: 'CFD', price: 17 }, { name: 'CEZ 2', price: 17 },
    { name: 'HTI', price: 17 }, { name: 'SCAD 5th Factory', price: 17 }, { name: 'SCAD', price: 17 },
    { name: 'PV Tech', price: 17 }, { name: 'WUKONG Expansion', price: 17 },
    { name: 'Wukong 4th factory', price: 17 }, { name: 'Wukong Plastic Moulding', price: 17 },
    { name: 'Wukong Prep 4.0', price: 17 }, { name: 'Wukong Sawmill', price: 17 },
    { name: 'Wukong CEZ 2 Warehouse Majestic', price: 17 }, { name: 'Wukong Steel Majestic', price: 17 },
    { name: 'Arkray', price: 18 }, { name: 'Santech Neomax 1', price: 19.5 },
    { name: 'Santech Neomax 2', price: 19.5 }, { name: 'Santech Thermal', price: 19.5 },
    { name: 'Santech Admin', price: 19.5 }, { name: 'Santech STAP', price: 19.5 },
    { name: 'Santech STAA', price: 19.5 }, { name: 'MEC', price: 20 },
    { name: 'Itabashi', price: 20 }, { name: 'S&S Phils', price: 20 },
    { name: 'Seintogether', price: 20 }, { name: 'Danam', price: 20 },
    { name: 'Danam Canteen', price: 20 }, { name: 'Danam T', price: 20 },
    { name: 'Danam Warehouse', price: 20 }, { name: 'Wyntron', price: 20 },
    { name: 'Wyntron Canteen', price: 20 }, { name: 'Wyntron Warehouse', price: 20 },
    { name: 'Wyntron Stafhouse', price: 20 }, { name: 'PVi', price: 20 },
    { name: 'PVI Canteen', price: 20 }, { name: 'DKP', price: 20 },
    { name: 'DKP Canteen', price: 20 }, { name: 'Dyna', price: 20 },
    { name: 'EN', price: 20 }, { name: 'NX Logistics', price: 20 },
    { name: 'Warehouse Management', price: 20 }, { name: 'RCBC', price: 20 },
    { name: 'Castem', price: 21 }, { name: 'YKY', price: 21 },
    { name: 'GOLDRICH', price: 22 }, { name: 'YM Tech', price: 23 }
  ];

  return new Promise((resolve, reject) => {
    db.all("SELECT COUNT(*) as count FROM companies", (err, rows) => {
      if (err) {
        reject(err);
      } else if (rows[0].count === 0) {
        const stmt = db.prepare("INSERT OR IGNORE INTO companies (name, unit_price) VALUES (?, ?)");
        companyData.forEach(c => stmt.run(c.name, c.price));
        stmt.finalize((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

function seedDefaultUsers() {
  return new Promise((resolve, reject) => {
    db.all("SELECT COUNT(*) as count FROM users", (err, rows) => {
      if (err) {
        reject(err);
      } else if (rows[0].count === 0) {
        // Hash both admin and owner passwords
        Promise.all([
          new Promise((res, rej) => bcrypt.hash('Admin123', 10, (err, hash) => err ? rej(err) : res(hash))),
          new Promise((res, rej) => bcrypt.hash('Olimar123', 10, (err, hash) => err ? rej(err) : res(hash)))
        ]).then(([adminHash, ownerHash]) => {
          const defaultUsers = [
            { username: 'Admin', email: 'admin@eaucure.com', password_hash: adminHash, role: 'admin' },
            { username: 'Olimar', email: 'owner@eaucure.com', password_hash: ownerHash, role: 'owner' }
          ];

          const stmt = db.prepare(
            "INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
          );

          defaultUsers.forEach(u => {
            stmt.run(u.username, u.email, u.password_hash, u.role);
          });

          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
          });
        }).catch(reject);
      } else {
        resolve();
      }
    });
  });
}

function getAllDeliveries() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM deliveries ORDER BY timestamp DESC', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function addDelivery(company, bottlesDelivered, bottlesReturned, drNumber, timestamp) {
  return new Promise((resolve, reject) => {
    const finalTimestamp = timestamp || new Date().toISOString();
    db.run(
      'INSERT INTO deliveries (company, bottles_delivered, bottles_returned, dr_number, timestamp) VALUES (?, ?, ?, ?, ?)',
      [company, bottlesDelivered, bottlesReturned, drNumber, finalTimestamp],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function updateDelivery(id, company, bottlesDelivered, bottlesReturned, drNumber) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE deliveries SET company = ?, bottles_delivered = ?, bottles_returned = ?, dr_number = ? WHERE id = ?',
      [company, bottlesDelivered, bottlesReturned, drNumber, id],
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function deleteDelivery(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM deliveries WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getCompanies() {
  return COMPANIES;
}

function getAllCompaniesFromDB() {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, name, unit_price FROM companies ORDER BY name", (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function addCompany(name, unitPrice) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO companies (name, unit_price) VALUES (?, ?)",
      [name, unitPrice],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getCompanyPrice(companyName) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT unit_price FROM companies WHERE name = ?",
      [companyName],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.unit_price : 0);
      }
    );
  });
}

function updateCompanyPrice(companyName, unitPrice) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE companies SET unit_price = ? WHERE name = ?",
      [unitPrice, companyName],
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function getBillingStatement(companyName, startDate, endDate) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, company, bottles_delivered, bottles_returned, dr_number, timestamp
       FROM deliveries
       WHERE company = ? AND timestamp >= ? AND timestamp <= ?
       ORDER BY timestamp`,
      [companyName, startDate + 'T00:00:00', endDate + 'T23:59:59'],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

function saveBillingStatement(companyName, startDate, endDate, totalAmount) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO billing_statements (company_name, start_date, end_date, total_amount, is_paid)
       VALUES (?, ?, ?, ?, 0)`,
      [companyName, startDate, endDate, totalAmount],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getAllBillingStatements() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM billing_statements ORDER BY created_date DESC`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

function updateBillingStatementStatus(id, isPaid) {
  return new Promise((resolve, reject) => {
    const paidDate = isPaid ? new Date().toISOString() : null;
    db.run(
      `UPDATE billing_statements SET is_paid = ?, paid_date = ? WHERE id = ?`,
      [isPaid ? 1 : 0, paidDate, id],
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function deleteBillingStatement(id) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM billing_statements WHERE id = ?`,
      [id],
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function updateBillingInvoiceNumber(id, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const invoiceValue = invoiceNumber && invoiceNumber.trim() ? invoiceNumber.trim() : null;
    db.run(
      `UPDATE billing_statements SET invoice_number = ? WHERE id = ?`,
      [invoiceValue, id],
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Billing statement not found'));
        } else {
          // Fetch and return updated record
          db.get(
            `SELECT * FROM billing_statements WHERE id = ?`,
            [id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        }
      }
    );
  });
}

function getDeliveriesByFilters(company, startDate, endDate) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM deliveries WHERE 1=1';
    const params = [];

    if (company && company.trim()) {
      query += ' AND company = ?';
      params.push(company);
    }

    if (startDate) {
      query += ' AND DATE(timestamp) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(timestamp) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC';

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getStats(startDate, endDate) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT COUNT(*) as total_deliveries, SUM(bottles_delivered) as total_delivered, SUM(bottles_returned) as total_returned FROM deliveries WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate + 'T00:00:00');
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate + 'T23:59:59');
    }

    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getCompanyStats(startDate, endDate) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT company, COUNT(*) as delivery_count,
             SUM(bottles_delivered) as total_delivered,
             SUM(bottles_returned) as total_returned
      FROM deliveries
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate + 'T00:00:00');
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate + 'T23:59:59');
    }

    query += ' GROUP BY company ORDER BY delivery_count DESC';

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function createBackupDirectory() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function performBackup() {
  return new Promise((resolve, reject) => {
    try {
      createBackupDirectory();

      if (!fs.existsSync(DB_PATH)) {
        resolve({ success: false, message: 'Database file not found' });
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupFilename = `backup_${timestamp}.db`;
      const backupPath = path.join(BACKUP_DIR, backupFilename);

      fs.copyFileSync(DB_PATH, backupPath);
      cleanOldBackups();

      console.log(`Backup created: ${backupFilename}`);
      resolve({ success: true, filename: backupFilename, timestamp });
    } catch (err) {
      reject(err);
    }
  });
}

function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAge = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(filePath);
      const age = now - stat.mtime.getTime();

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    });
  } catch (err) {
    console.error('Error cleaning old backups:', err);
  }
}

function listBackups() {
  return new Promise((resolve, reject) => {
    try {
      createBackupDirectory();
      const files = fs.readdirSync(BACKUP_DIR);
      const backups = files
        .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
        .map(f => {
          const filePath = path.join(BACKUP_DIR, f);
          const stat = fs.statSync(filePath);
          return {
            filename: f,
            created: stat.mtime.toISOString(),
            size: stat.size
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));

      resolve(backups);
    } catch (err) {
      reject(err);
    }
  });
}

// Only plain names like backup_2026-11-03T02-30-53.db — no slashes or "..",
// so a filename can never point outside BACKUP_DIR (e.g. at the live DB).
function isValidBackupFilename(filename) {
  return typeof filename === 'string' && /^backup_[A-Za-z0-9_-]+\.db$/.test(filename);
}

function restoreBackup(backupFilename) {
  return new Promise((resolve, reject) => {
    try {
      if (!isValidBackupFilename(backupFilename)) {
        throw new Error('Invalid backup filename');
      }

      const backupPath = path.join(BACKUP_DIR, backupFilename);

      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      fs.copyFileSync(backupPath, DB_PATH);
      console.log(`Database restored from: ${backupFilename}`);
      resolve({ success: true, message: 'Database restored successfully' });
    } catch (err) {
      reject(err);
    }
  });
}

// Expense functions
function getExpenses(startDate, endDate, category) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND expense_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND expense_date <= ?';
      params.push(endDate);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY expense_date DESC, id DESC';

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function addExpense(expenseDate, category, amount, notes) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO expenses (expense_date, category, amount, notes) VALUES (?, ?, ?, ?)',
      [expenseDate, category, amount, notes || ''],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function updateExpense(id, expenseDate, category, amount, notes) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE expenses SET expense_date = ?, category = ?, amount = ?, notes = ? WHERE id = ?',
      [expenseDate, category, amount, notes || '', id],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
}

function deleteExpense(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM expenses WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

// Sales = bottles delivered x the company's current unit price, the same rule
// the Dashboard earnings use. A delivery's date is the YYYY-MM-DD part of its timestamp.
function getDailySalesAndExpenses(startDate, endDate) {
  const salesQuery = `
    SELECT substr(d.timestamp, 1, 10) AS day,
           SUM(d.bottles_delivered * COALESCE(c.unit_price, 0)) AS total
    FROM deliveries d
    LEFT JOIN companies c ON c.name = d.company
    WHERE substr(d.timestamp, 1, 10) BETWEEN ? AND ?
    GROUP BY day
  `;
  const expensesQuery = `
    SELECT expense_date AS day, SUM(amount) AS total
    FROM expenses
    WHERE expense_date BETWEEN ? AND ?
    GROUP BY day
  `;

  const run = (query) => new Promise((resolve, reject) => {
    db.all(query, [startDate, endDate], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  return Promise.all([run(salesQuery), run(expensesQuery)]).then(([salesRows, expenseRows]) => {
    const days = {};
    salesRows.forEach(r => { days[r.day] = { sales: r.total || 0, expenses: 0 }; });
    expenseRows.forEach(r => {
      days[r.day] = days[r.day] || { sales: 0, expenses: 0 };
      days[r.day].expenses = r.total || 0;
    });
    return days;
  });
}

function getSalesExpensesSummary(startDate, endDate) {
  const salesQuery = `
    SELECT COUNT(*) AS delivery_count,
           COALESCE(SUM(d.bottles_delivered), 0) AS bottles_delivered,
           COALESCE(SUM(d.bottles_delivered * COALESCE(c.unit_price, 0)), 0) AS total_sales
    FROM deliveries d
    LEFT JOIN companies c ON c.name = d.company
    WHERE substr(d.timestamp, 1, 10) BETWEEN ? AND ?
  `;
  const expensesQuery = `
    SELECT category, COUNT(*) AS entries, SUM(amount) AS total
    FROM expenses
    WHERE expense_date BETWEEN ? AND ?
    GROUP BY category
  `;

  return new Promise((resolve, reject) => {
    db.get(salesQuery, [startDate, endDate], (err, sales) => {
      if (err) return reject(err);
      db.all(expensesQuery, [startDate, endDate], (err2, rows) => {
        if (err2) return reject(err2);

        // Always list every category (₱0 when unused) in the fixed order
        const byCategory = {};
        (rows || []).forEach(r => { byCategory[r.category] = r; });
        const knownCategories = EXPENSE_CATEGORIES.map(category => ({
          category,
          entries: byCategory[category]?.entries || 0,
          total: byCategory[category]?.total || 0
        }));
        const otherCategories = (rows || [])
          .filter(r => !EXPENSE_CATEGORIES.includes(r.category))
          .map(r => ({ category: r.category, entries: r.entries, total: r.total }));
        const expensesByCategory = knownCategories.concat(otherCategories);

        const totalExpenses = expensesByCategory.reduce((sum, c) => sum + c.total, 0);
        resolve({
          start_date: startDate,
          end_date: endDate,
          delivery_count: sales.delivery_count,
          bottles_delivered: sales.bottles_delivered,
          total_sales: sales.total_sales,
          total_expenses: totalExpenses,
          net_income: sales.total_sales - totalExpenses,
          expenses_by_category: expensesByCategory
        });
      });
    });
  });
}

// User management functions
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

module.exports = {
  initDB,
  isValidBackupFilename,
  createUserTable,
  createUser,
  getUserByUsername,
  getUserById,
  getAllUsers,
  deleteUserById,
  updateUserRole,
  getAllDeliveries,
  addDelivery,
  updateDelivery,
  deleteDelivery,
  getCompanies,
  getAllCompaniesFromDB,
  addCompany,
  getCompanyPrice,
  updateCompanyPrice,
  getBillingStatement,
  saveBillingStatement,
  getAllBillingStatements,
  updateBillingStatementStatus,
  deleteBillingStatement,
  updateBillingInvoiceNumber,
  getDeliveriesByFilters,
  getStats,
  getCompanyStats,
  EXPENSE_CATEGORIES,
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getDailySalesAndExpenses,
  getSalesExpensesSummary,
  performBackup,
  listBackups,
  restoreBackup
};
