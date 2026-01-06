import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from './migrations';

const dbPath = path.join(process.cwd(), './data/beactive.db');
// Ensure the data directory exists, if not create it
if (!require('fs').existsSync(path.dirname(dbPath))) {
  require('fs').mkdirSync(path.dirname(dbPath), { recursive: true });
}
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Run migrations automatically
export function initializeDatabase() {
  runMigrations(db);
}

export default db;
