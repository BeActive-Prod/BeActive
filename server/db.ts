import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'beactive.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rollover_hour INTEGER DEFAULT 4,
      rollover_minute INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      title TEXT NOT NULL,
      deadline_hour INTEGER NOT NULL,
      deadline_minute INTEGER NOT NULL,
      completed BOOLEAN DEFAULT 0,
      completed_date TEXT,
      completed_hour INTEGER,
      completed_minute INTEGER,
      completed_second INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    )
  `);
}

export default db;
