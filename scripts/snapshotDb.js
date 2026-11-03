// Writes a consistent copy of the live database to the given path.
// Uses SQLite's VACUUM INTO, which is safe while the app is running
// (unlike a plain file copy, which can catch a half-finished write).
//
// Usage: node scripts/snapshotDb.js <output.db>
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');

const DB_PATH = path.join(__dirname, '..', 'data', 'water_station.db');
const outPath = process.argv[2];

if (!outPath) {
  console.error('Usage: node scripts/snapshotDb.js <output.db>');
  process.exit(1);
}
if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found: ${DB_PATH}`);
  process.exit(1);
}
if (fs.existsSync(outPath)) {
  fs.unlinkSync(outPath); // VACUUM INTO refuses to overwrite
}

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
  db.run('VACUUM INTO ?', [path.resolve(outPath)], (err) => {
    db.close();
    if (err) {
      console.error('Snapshot failed:', err.message);
      process.exit(1);
    }
    console.log(`Snapshot written: ${outPath}`);
  });
});
