import Database from 'better-sqlite3';

interface Migration {
  version: number;
  description: string;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial schema with lists and todos',
    up: (db) => {
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
  },
  {
    version: 2,
    description: 'Add users table and authentication',
    up: (db) => {
  db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

      db.exec(`
        ALTER TABLE lists ADD COLUMN user_id TEXT
      `);

      db.exec(`
        ALTER TABLE lists ADD COLUMN is_public BOOLEAN DEFAULT 0
      `);
    }
  },
  {
    version: 3,
    description: 'Add invites table for invite links',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS invites (
          id TEXT PRIMARY KEY,
          token TEXT NOT NULL UNIQUE,
          created_by TEXT NOT NULL,
          max_uses INTEGER NOT NULL,
          current_uses INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);
    }
  },
];

export function runMigrations(db: Database.Database) {
  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get current migration version
  const currentVersion = db.prepare('SELECT MAX(version) as version FROM migrations').get() as { version: number | null };
  const currentVersionNumber = currentVersion?.version || 0;

  console.log(`Current database version: ${currentVersionNumber}`);

  // Run pending migrations
  const pendingMigrations = migrations.filter(m => m.version > currentVersionNumber);
  
  if (pendingMigrations.length === 0) {
    console.log('Database is up to date');
    return;
  }

  console.log(`Running ${pendingMigrations.length} pending migration(s)...`);

  for (const migration of pendingMigrations) {
    console.log(`Applying migration ${migration.version}: ${migration.description}`);
    
    // Run migration in a transaction
    const applyMigration = db.transaction(() => {
      migration.up(db);
      db.prepare('INSERT INTO migrations (version, description) VALUES (?, ?)').run(
        migration.version,
        migration.description
      );
    });

    try {
      applyMigration();
      console.log(`✓ Migration ${migration.version} applied successfully`);
    } catch (error) {
      console.error(`✗ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  console.log('All migrations completed successfully');
}

export default migrations;

