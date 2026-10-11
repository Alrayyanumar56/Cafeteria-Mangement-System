// ALL database code lives here. Swap the engine = change only this file + the controllers' SQL.
'use strict';
const { DatabaseSync } = require('node:sqlite');   // built into Node 22.13+, nothing to compile
const path = require('path'), fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'cafepos.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const raw = new DatabaseSync(DB_PATH);
raw.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
const db = {
  prepare: sql => raw.prepare(sql),
  exec: sql => raw.exec(sql),
  transaction: fn => (...args) => {          // all-or-nothing: if anything fails, nothing is saved
    raw.exec('BEGIN');
    try { const r = fn(...args); raw.exec('COMMIT'); return r; }
    catch (e) { raw.exec('ROLLBACK'); throw e; }
  }
};

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  kitchen INTEGER NOT NULL DEFAULT 0      -- 1 = items here go to the kitchen screen by default
);
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  price REAL NOT NULL CHECK (price >= 0),
  unit TEXT DEFAULT '',
  image TEXT DEFAULT '',
  kitchen INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL, quantity REAL DEFAULT 0, unit TEXT, note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token INTEGER NOT NULL,                 -- restarts at 1 every day
  sale_date TEXT NOT NULL,                -- local date YYYY-MM-DD
  customer_name TEXT DEFAULT '',
  total REAL NOT NULL,
  cash_paid REAL NOT NULL,                -- cash KEPT (change already removed)
  online_paid REAL NOT NULL,
  change_given REAL NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL,             -- cash | online | mixed
  created_at TEXT NOT NULL                -- local date-time
);
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL, qty INTEGER NOT NULL, price REAL NOT NULL,
  kitchen INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'      -- new -> ready -> served (kitchen items only)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_token ON sales(sale_date, token);
CREATE INDEX IF NOT EXISTS ix_sale_items_sale ON sale_items(sale_id);
`);

if (db.prepare('SELECT COUNT(*) n FROM categories').get().n === 0) {
  const ins = db.prepare('INSERT INTO categories (name, kitchen) VALUES (?, ?)');
  [['Meals', 0], ['Shawarma & Rolls', 1], ['Shakes', 1], ['Cold Drinks', 0], ['Snacks', 0], ['Tea & Coffee', 0]]
    .forEach(c => ins.run(...c));
}

// Daily backup: copy of the database, keeps the last 14 days.
if (!process.env.NO_BACKUP) {
  const dir = path.join(path.dirname(DB_PATH), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'cafepos-' + new Date().toISOString().slice(0, 10) + '.db');
  if (!fs.existsSync(file)) {
    try {
      raw.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
      fs.readdirSync(dir).filter(f => f.endsWith('.db')).sort().slice(0, -14)
        .forEach(f => fs.unlinkSync(path.join(dir, f)));
    } catch (e) { console.error('Backup failed:', e.message); }
  }
}
module.exports = db;
