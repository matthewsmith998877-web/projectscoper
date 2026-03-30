const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'scopebuilder.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── SCHEMA ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    chargeout_rate REAL NOT NULL,
    cost_rate REAL NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scopes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT 'Unnamed Scope',
    client_name TEXT,
    project_timeline TEXT,
    prepared_by TEXT,
    project_description TEXT,
    currency TEXT NOT NULL DEFAULT '£',
    status TEXT NOT NULL DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scope_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    hours REAL NOT NULL DEFAULT 0,
    UNIQUE(scope_id, role_id, task_id),
    FOREIGN KEY (scope_id) REFERENCES scopes(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  );
`);

// ── SEED ─────────────────────────────────────────────────────────────────────

function seed() {
  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@agency.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Admin', adminEmail, hash, 'admin'
    );
    console.log(`[db] Admin user created: ${adminEmail}`);
  }

  // Default roles
  const defaultRoles = [
    { name: 'Strategy Director', chargeout_rate: 175, cost_rate: 105, sort_order: 1 },
    { name: 'Creative Director',  chargeout_rate: 150, cost_rate: 90,  sort_order: 2 },
    { name: 'Senior Designer',    chargeout_rate: 110, cost_rate: 66,  sort_order: 3 },
    { name: 'Designer',           chargeout_rate: 85,  cost_rate: 51,  sort_order: 4 },
    { name: 'Senior Developer',   chargeout_rate: 130, cost_rate: 78,  sort_order: 5 },
    { name: 'Developer',          chargeout_rate: 100, cost_rate: 60,  sort_order: 6 },
    { name: 'Project Manager',    chargeout_rate: 95,  cost_rate: 57,  sort_order: 7 },
    { name: 'Copywriter',         chargeout_rate: 90,  cost_rate: 54,  sort_order: 8 },
    { name: 'Account Manager',    chargeout_rate: 80,  cost_rate: 48,  sort_order: 9 },
  ];
  const insertRole = db.prepare(
    'INSERT OR IGNORE INTO roles (name, chargeout_rate, cost_rate, sort_order) VALUES (?, ?, ?, ?)'
  );
  defaultRoles.forEach(r => insertRole.run(r.name, r.chargeout_rate, r.cost_rate, r.sort_order));

  // Default tasks
  const defaultTasks = [
    'Strategy', 'Creative', 'Development',
    'Project Management', 'QA & Testing', 'Content', 'Analytics'
  ];
  const insertTask = db.prepare('INSERT OR IGNORE INTO tasks (name, sort_order) VALUES (?, ?)');
  defaultTasks.forEach((t, i) => insertTask.run(t, i + 1));

  console.log('[db] Seed complete');
}

seed();

module.exports = db;
