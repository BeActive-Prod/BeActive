import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from './migrations';

const dbPath = path.join(process.cwd(), 'beactive.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Run migrations automatically
export function initializeDatabase() {
  runMigrations(db);
}

export default db;
