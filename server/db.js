require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(
  process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'capsules.db')
);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// create tables
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

db.dbPath = dbPath;
module.exports = db;
