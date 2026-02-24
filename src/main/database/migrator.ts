import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { executeAll, executeRun, executeScalar, saveDatabase } from './connection';

/**
 * Migration record stored in the migrations table
 */
interface MigrationRecord {
  id: number;
  name: string;
  applied_at: string;
}

/**
 * Migration file info
 */
interface MigrationFile {
  filename: string;
  name: string;
  version: number;
  sql: string;
}

const MIGRATIONS_TABLE_NAME = 'migrations';

/**
 * Get the migrations directory path
 * In development, use the source directory
 * In production, use the bundled directory
 */
function getMigrationsDir(): string {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['VITE_DEV_SERVER_URL'] !== undefined;

  if (isDev) {
    // In development, look for migrations in the source directory
    // __dirname is dist/main/database, so go up 2 levels to project root, then into src
    return path.join(__dirname, '..', '..', 'src', 'main', 'database', 'migrations');
  }

  // In production, migrations should be bundled with the app
  return path.join(__dirname, 'migrations');
}

const MIGRATIONS_DIR = getMigrationsDir();

/**
 * Ensure the migrations tracking table exists
 */
function ensureMigrationsTable(): void {
  executeRun(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  saveDatabase();
}

/**
 * Get list of already applied migrations
 */
function getAppliedMigrations(): Set<string> {
  const rows = executeAll<MigrationRecord>(`SELECT name FROM ${MIGRATIONS_TABLE_NAME}`);
  return new Set(rows.map((row) => row.name));
}

/**
 * Parse migration filename to extract version and name
 * Expected format: NNN-description.sql (e.g., 001-initial-schema.sql)
 */
function parseMigrationFilename(filename: string): { version: number; name: string } | null {
  const match = /^(\d+)-(.+)\.sql$/.exec(filename);
  if (match === null || match.length < 3) {
    return null;
  }
  return {
    version: parseInt(match[1] ?? '0', 10),
    name: match[2] ?? '',
  };
}

/**
 * Load all migration files from the migrations directory
 */
function loadMigrationFiles(): MigrationFile[] {
  let files: string[];

  try {
    files = fs.readdirSync(MIGRATIONS_DIR);
  } catch {
    // Migrations directory doesn't exist yet
    return [];
  }

  const migrations: MigrationFile[] = [];

  for (const filename of files) {
    const parsed = parseMigrationFilename(filename);
    if (parsed === null) {
      console.warn(`Skipping invalid migration filename: ${filename}`);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    migrations.push({
      filename,
      name: parsed.name,
      version: parsed.version,
      sql,
    });
  }

  // Sort by version number
  migrations.sort((a, b) => a.version - b.version);

  return migrations;
}

/**
 * Record a migration as applied
 */
function recordMigration(name: string): void {
  executeRun(`INSERT INTO ${MIGRATIONS_TABLE_NAME} (name) VALUES (?)`, [name]);
}

/**
 * Check if a migration contains multiple statements
 */
function hasMultipleStatements(sql: string): boolean {
  // Simple check - count semicolons not inside quotes
  let count = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (inString) {
      if (char === stringChar && (i === 0 || sql[i - 1] !== '\\')) {
        // Handle SQL escaped quotes represented by doubled quote characters.
        if (i + 1 < sql.length && sql[i + 1] === stringChar) {
          i++;
          continue;
        }
        inString = false;
      }
    } else if (char === "'" || char === '"') {
      inString = true;
      stringChar = char;
    } else if (char === ';') {
      count++;
    }
  }

  return count > 1;
}

/**
 * Apply a single migration within a transaction
 */
function applyMigration(migration: MigrationFile): void {
  const migrationName = migration.name;

  // Start transaction
  executeRun('BEGIN TRANSACTION');

  try {
    // sql.js can handle multiple statements via exec()
    // We need to be careful with INSERT statements that may have multiple rows
    if (hasMultipleStatements(migration.sql)) {
      // Split and execute statements individually for better control
      const statements = splitSqlStatements(migration.sql);
      for (const statement of statements) {
        if (statement.trim().length > 0) {
          executeRun(statement);
        }
      }
    } else {
      executeRun(migration.sql);
    }

    // Record the migration
    recordMigration(migrationName);

    // Commit transaction
    executeRun('COMMIT');
    saveDatabase();
  } catch (error) {
    // Rollback on error
    try {
      executeRun('ROLLBACK');
    } catch {
      // Ignore rollback errors
    }
    throw new Error(`Failed to apply migration ${migration.filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Split SQL into individual statements, handling edge cases
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (inString) {
      current += char;
      if (char === stringChar && (i === 0 || sql[i - 1] !== '\\')) {
        // Check if this is an escaped quote (doubled)
        if (i + 1 < sql.length && sql[i + 1] === stringChar) {
          // It's a doubled quote; include the second quote and keep parsing the string.
          current += stringChar;
          i++;
          continue;
        }
        inString = false;
      }
    } else if (char === "'" || char === '"') {
      current += char;
      inString = true;
      stringChar = char;
    } else if (char === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last statement if no trailing semicolon
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

/**
 * Get the count of pending migrations
 */
export function getPendingMigrationCount(): number {
  ensureMigrationsTable();
  const applied = getAppliedMigrations();
  const files = loadMigrationFiles();
  return files.filter((f) => !applied.has(f.name)).length;
}

/**
 * Get migration status info
 */
export function getMigrationStatus(): { applied: number; pending: number } {
  ensureMigrationsTable();
  const applied = getAppliedMigrations();
  const files = loadMigrationFiles();
  const appliedCount = files.filter((f) => applied.has(f.name)).length;

  return {
    applied: appliedCount,
    pending: files.length - appliedCount,
  };
}

/**
 * Run all pending migrations
 * @returns Number of migrations applied
 */
export function runMigrations(): number {
  // Ensure migrations table exists
  ensureMigrationsTable();

  // Get applied migrations
  const applied = getAppliedMigrations();

  // Load migration files
  const migrations = loadMigrationFiles();

  // Filter to pending migrations
  const pending = migrations.filter((m) => !applied.has(m.name));

  if (pending.length === 0) {
    return 0;
  }

  // Apply each migration in order
  for (const migration of pending) {
    applyMigration(migration);
  }

  return pending.length;
}

/**
 * Check if all migrations have been applied
 */
export function isMigrationComplete(): boolean {
  ensureMigrationsTable();
  const applied = getAppliedMigrations();
  const files = loadMigrationFiles();
  return files.every((f) => applied.has(f.name));
}

/**
 * Get the current schema version (highest applied migration number)
 */
export function getSchemaVersion(): number {
  ensureMigrationsTable();
  const version = executeScalar<number>(`SELECT MAX(id) FROM ${MIGRATIONS_TABLE_NAME}`);
  return version ?? 0;
}
