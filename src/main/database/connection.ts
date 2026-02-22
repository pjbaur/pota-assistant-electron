import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import type { Database, SqlJsStatic } from 'sql.js';

/**
 * Database connection manager for sql.js
 *
 * sql.js is a JavaScript implementation of SQLite that runs in memory.
 * This module handles:
 * - Initializing the sql.js WASM module
 * - Loading the database from disk on startup
 * - Saving the database to disk on changes
 * - Providing a singleton database connection
 */

let sqlJs: SqlJsStatic | null = null;
let db: Database | null = null;
let dbPath: string | null = null;

/**
 * Get the path to the database file in the user data directory
 */
function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'pota-planner.db');
}

/**
 * Get the path to the WASM file
 */
function getWasmPath(): string {
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['VITE_DEV_SERVER_URL'] !== undefined;

  if (isDev) {
    // In development, load from node_modules relative to the project root
    // __dirname in bundled code is dist/main, so we need to go up 2 levels to get to project root
    return path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  }
  // In production, the WASM file should be bundled alongside the app
  return path.join(process.resourcesPath ?? '', 'sql-wasm.wasm');
}

/**
 * Ensure the user data directory exists
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Initialize sql.js WASM module
 */
async function initSqlJsModule(): Promise<SqlJsStatic> {
  if (sqlJs !== null) {
    return sqlJs;
  }

  const wasmPath = getWasmPath();
  const isDev = process.env['NODE_ENV'] === 'development' || process.env['VITE_DEV_SERVER_URL'] !== undefined;

  let result: SqlJsStatic;

  if (isDev) {
    // In development, use locateFile with the absolute path
    result = await initSqlJs({
      locateFile: (file: string) => path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file),
    });
  } else {
    // In production, read the WASM binary manually
    const wasmBuffer = fs.readFileSync(wasmPath);
    const wasmBinary = new Uint8Array(wasmBuffer);
    result = await initSqlJs({ wasmBinary });
  }

  sqlJs = result;
  return sqlJs;
}

/**
 * Load database from disk if it exists
 */
function loadDatabaseFromDisk(sql: SqlJsStatic, filePath: string): Database {
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    return new sql.Database(buffer);
  }
  // Return a new empty database
  return new sql.Database();
}

/**
 * Save database to disk
 */
export function saveDatabase(): void {
  if (db === null || dbPath === null) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }

  const data = db.export();
  const buffer = Buffer.from(data);
  ensureDirectoryExists(dbPath);
  fs.writeFileSync(dbPath, buffer);
}

/**
 * Get the current database instance
 * @throws Error if database hasn't been initialized
 */
export function getDatabase(): Database {
  if (db === null) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}

/**
 * Initialize the database connection
 * This should be called early in the app lifecycle (before app ready is fine,
 * but typically called during or after app ready)
 */
export async function initializeDatabase(): Promise<Database> {
  if (db !== null) {
    return db;
  }

  const sql = await initSqlJsModule();
  dbPath = getDatabasePath();
  db = loadDatabaseFromDisk(sql, dbPath);

  return db;
}

/**
 * Close the database connection and save to disk
 */
export function closeDatabase(): void {
  if (db !== null) {
    saveDatabase();
    db.close();
    db = null;
  }
}

/**
 * Execute a SQL query and return results
 */
export function executeQuery(sql: string, params?: initSqlJs.BindParams): initSqlJs.QueryExecResult[] {
  const database = getDatabase();
  return database.exec(sql, params);
}

/**
 * Execute a SQL statement (INSERT, UPDATE, DELETE) and return number of rows modified
 */
export function executeRun(sql: string, params?: initSqlJs.BindParams): number {
  const database = getDatabase();
  database.run(sql, params);
  return database.getRowsModified();
}

/**
 * Execute a SQL statement that returns a single value
 */
export function executeScalar<T = initSqlJs.SqlValue>(sql: string, params?: initSqlJs.BindParams): T | null {
  const results = executeQuery(sql, params);
  if (results.length === 0 || results[0]?.values.length === 0) {
    return null;
  }
  const firstRow = results[0]?.values[0];
  const firstValue = firstRow?.[0];
  return firstValue !== undefined ? (firstValue as T) : null;
}

/**
 * Execute a SQL query and return all rows as objects
 */
export function executeAll<T = Record<string, initSqlJs.SqlValue>>(
  sql: string,
  params?: initSqlJs.BindParams
): T[] {
  const results = executeQuery(sql, params);
  if (results.length === 0) {
    return [];
  }

  const result = results[0];
  if (result === undefined) {
    return [];
  }

  const { columns, values } = result;
  return values.map((row) => {
    const obj: Record<string, initSqlJs.SqlValue> = {};
    columns.forEach((col, index) => {
      const value = row[index];
      obj[col] = value ?? null;
    });
    return obj as T;
  });
}

/**
 * Execute a SQL query and return the first row as an object
 */
export function executeOne<T = Record<string, initSqlJs.SqlValue>>(
  sql: string,
  params?: initSqlJs.BindParams
): T | null {
  const rows = executeAll<T>(sql, params);
  return rows.length > 0 ? rows[0] ?? null : null;
}

/**
 * Execute multiple SQL statements in a transaction
 */
export function executeTransaction(statements: Array<{ sql: string; params?: initSqlJs.BindParams }>): void {
  const database = getDatabase();

  try {
    database.exec('BEGIN TRANSACTION');

    for (const { sql, params } of statements) {
      database.run(sql, params);
    }

    database.exec('COMMIT');
    saveDatabase();
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Record import metadata after a successful CSV import
 */
export function recordImportMetadata(filename: string, rowsImported: number): void {
  const sql = `
    INSERT INTO import_metadata (filename, rows_imported, imported_at)
    VALUES (?, ?, datetime('now'))
  `;
  executeRun(sql, [filename, rowsImported]);
  saveDatabase();
}

/**
 * Get the most recent import metadata
 */
export function getLatestImportMetadata(): { filename: string; rows_imported: number; imported_at: string } | null {
  const sql = `
    SELECT filename, rows_imported, imported_at
    FROM import_metadata
    ORDER BY imported_at DESC
    LIMIT 1
  `;
  return executeOne<{ filename: string; rows_imported: number; imported_at: string }>(sql);
}

/**
 * Get all import metadata records
 */
export function getAllImportMetadata(): Array<{ id: number; filename: string; rows_imported: number; imported_at: string }> {
  const sql = `
    SELECT id, filename, rows_imported, imported_at
    FROM import_metadata
    ORDER BY imported_at DESC
  `;
  return executeAll<{ id: number; filename: string; rows_imported: number; imported_at: string }>(sql);
}
