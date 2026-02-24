import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

const { getPathMock } = vi.hoisted(() => ({
  getPathMock: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    getPath: getPathMock,
    on: vi.fn(),
  },
}));

type ConnectionModule = typeof import('../../../src/main/database/connection');

const WASM_DIR = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist');
const WASM_FILE = path.join(WASM_DIR, 'sql-wasm.wasm');

let tempDir = '';
let previousEnv: NodeJS.ProcessEnv;
let previousResourcesPath: string | undefined;
let loadedModule: ConnectionModule | null = null;

function getDbFilePath(): string {
  return path.join(tempDir, 'pota-planner.db');
}

async function importConnectionModule(): Promise<ConnectionModule> {
  loadedModule = await import('../../../src/main/database/connection');
  return loadedModule;
}

async function createDatabaseFile(filePath: string, setup: (db: Database) => void): Promise<void> {
  const wasmBuffer = fs.readFileSync(WASM_FILE);
  const SQL = await initSqlJs({ wasmBinary: new Uint8Array(wasmBuffer) });
  const db = new SQL.Database();

  setup(db);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(db.export()));
  db.close();
}

async function initializeWithImportTable(connection: ConnectionModule): Promise<void> {
  await connection.initializeDatabase();
  connection.executeRun(`
    CREATE TABLE IF NOT EXISTS import_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      rows_imported INTEGER NOT NULL,
      imported_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();

  previousEnv = { ...process.env };
  previousResourcesPath = process.resourcesPath;

  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pota-connection-test-'));
  getPathMock.mockReturnValue(tempDir);

  process.env['NODE_ENV'] = 'test';
  Object.defineProperty(process, 'resourcesPath', {
    value: WASM_DIR,
    configurable: true,
    writable: true,
  });

  loadedModule = null;
});

afterEach(() => {
  try {
    if (loadedModule !== null && loadedModule.isDatabaseInitialized()) {
      loadedModule.closeDatabase();
    }
  } catch {
    // Ignore cleanup errors from tests that intentionally break DB operations.
  }

  process.env = previousEnv;
  Object.defineProperty(process, 'resourcesPath', {
    value: previousResourcesPath,
    configurable: true,
    writable: true,
  });

  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('main/database/connection', () => {
  it('initializeDatabase creates a new DB file and returns database instance', async () => {
    const connection = await importConnectionModule();

    const db = await connection.initializeDatabase();
    connection.saveDatabase();

    expect(db).toBeDefined();
    expect(fs.existsSync(getDbFilePath())).toBe(true);
  });

  it('initializeDatabase loads an existing DB file from disk', async () => {
    await createDatabaseFile(getDbFilePath(), (db) => {
      db.run('CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)');
      db.run('INSERT INTO items (name) VALUES (?)', ['existing-row']);
    });

    const connection = await importConnectionModule();
    await connection.initializeDatabase();

    const row = connection.executeOne<{ name: string }>(
      'SELECT name FROM items WHERE name = ?',
      ['existing-row']
    );
    expect(row).toEqual({ name: 'existing-row' });
  });

  it('initializeDatabase returns the existing singleton instance on second call', async () => {
    const connection = await importConnectionModule();

    const first = await connection.initializeDatabase();
    const second = await connection.initializeDatabase();

    expect(second).toBe(first);
  });

  it('getDatabase throws before initialization', async () => {
    const connection = await importConnectionModule();

    expect(() => connection.getDatabase()).toThrowError(
      'Database not initialized. Call initializeDatabase() first.'
    );
  });

  it('isDatabaseInitialized returns false before and true after initializeDatabase', async () => {
    const connection = await importConnectionModule();
    expect(connection.isDatabaseInitialized()).toBe(false);

    await connection.initializeDatabase();
    expect(connection.isDatabaseInitialized()).toBe(true);
  });

  it('executeQuery returns QueryExecResult[] for SELECT and [] for no matches', async () => {
    const connection = await importConnectionModule();
    await connection.initializeDatabase();

    connection.executeRun('CREATE TABLE parks (id INTEGER PRIMARY KEY, reference TEXT, name TEXT)');
    connection.executeRun('INSERT INTO parks (id, reference, name) VALUES (?, ?, ?)', [
      1,
      'K-0001',
      'Test Park',
    ]);

    const found = connection.executeQuery('SELECT reference, name FROM parks WHERE reference = ?', [
      'K-0001',
    ]);
    expect(found).toHaveLength(1);
    expect(found[0]?.columns).toEqual(['reference', 'name']);
    expect(found[0]?.values).toEqual([['K-0001', 'Test Park']]);

    const missing = connection.executeQuery('SELECT reference FROM parks WHERE reference = ?', [
      'K-9999',
    ]);
    expect(missing).toEqual([]);
  });

  it('executeRun returns rows modified count for INSERT and 0 for unmatched UPDATE', async () => {
    const connection = await importConnectionModule();
    await connection.initializeDatabase();

    connection.executeRun('CREATE TABLE updates (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)');

    const inserted = connection.executeRun('INSERT INTO updates (value) VALUES (?)', ['hello']);
    expect(inserted).toBeGreaterThan(0);

    const notUpdated = connection.executeRun('UPDATE updates SET value = ? WHERE id = ?', [
      'ignored',
      9999,
    ]);
    expect(notUpdated).toBe(0);
  });

  it('executeScalar returns single value and null for empty result set', async () => {
    const connection = await importConnectionModule();
    await connection.initializeDatabase();

    connection.executeRun('CREATE TABLE scalar_test (id INTEGER PRIMARY KEY)');
    connection.executeRun('INSERT INTO scalar_test (id) VALUES (1), (2), (3)');

    const count = connection.executeScalar<number>('SELECT COUNT(*) FROM scalar_test');
    expect(count).toBe(3);

    const none = connection.executeScalar<number>(
      'SELECT id FROM scalar_test WHERE id = ?',
      [9999]
    );
    expect(none).toBeNull();
  });

  it('executeAll maps rows to objects and returns [] for no rows', async () => {
    const connection = await importConnectionModule();
    await connection.initializeDatabase();

    connection.executeRun(
      'CREATE TABLE metrics (id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT, watts INTEGER)'
    );
    connection.executeRun('INSERT INTO metrics (label, watts) VALUES (?, ?), (?, ?)', [
      'QRP',
      5,
      'Portable',
      30,
    ]);

    const rows = connection.executeAll<{ id: number; label: string; watts: number }>(
      'SELECT id, label, watts FROM metrics ORDER BY id'
    );
    expect(rows).toEqual([
      { id: 1, label: 'QRP', watts: 5 },
      { id: 2, label: 'Portable', watts: 30 },
    ]);

    const empty = connection.executeAll<{ id: number }>('SELECT id FROM metrics WHERE id > ?', [
      100,
    ]);
    expect(empty).toEqual([]);
  });

  it('executeOne returns first row object and null when no rows', async () => {
    const connection = await importConnectionModule();
    await connection.initializeDatabase();

    connection.executeRun('CREATE TABLE single_row (id INTEGER PRIMARY KEY, label TEXT)');
    connection.executeRun('INSERT INTO single_row (id, label) VALUES (1, ?), (2, ?)', [
      'first',
      'second',
    ]);

    const first = connection.executeOne<{ id: number; label: string }>(
      'SELECT id, label FROM single_row ORDER BY id'
    );
    expect(first).toEqual({ id: 1, label: 'first' });

    const missing = connection.executeOne<{ id: number }>(
      'SELECT id FROM single_row WHERE id = ?',
      [999]
    );
    expect(missing).toBeNull();
  });

  it('executeTransaction commits all statements atomically', async () => {
    const connection = await importConnectionModule();
    await connection.initializeDatabase();

    connection.executeRun('CREATE TABLE tx_commit (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)');
    connection.executeTransaction([
      { sql: 'INSERT INTO tx_commit (value) VALUES (?)', params: ['one'] },
      { sql: 'INSERT INTO tx_commit (value) VALUES (?)', params: ['two'] },
    ]);

    const count = connection.executeScalar<number>('SELECT COUNT(*) FROM tx_commit');
    expect(count).toBe(2);
  });

  it('executeTransaction rolls back all statements if one fails', async () => {
    const connection = await importConnectionModule();
    await connection.initializeDatabase();

    connection.executeRun(
      'CREATE TABLE tx_rollback (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)'
    );

    expect(() =>
      connection.executeTransaction([
        { sql: 'INSERT INTO tx_rollback (value) VALUES (?)', params: ['valid'] },
        { sql: 'INSERT INTO missing_table (value) VALUES (?)', params: ['boom'] },
      ])
    ).toThrow();

    const count = connection.executeScalar<number>('SELECT COUNT(*) FROM tx_rollback');
    expect(count).toBe(0);
  });

  it('executeTransaction persists DB by calling save logic on commit', async () => {
    const connection = await importConnectionModule();
    await connection.initializeDatabase();

    connection.executeRun(
      'CREATE TABLE tx_save (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)'
    );

    connection.executeTransaction([{ sql: 'INSERT INTO tx_save (value) VALUES (?)', params: ['a'] }]);

    expect(fs.existsSync(getDbFilePath())).toBe(true);
  });

  it('saveDatabase throws when database is not initialized', async () => {
    const connection = await importConnectionModule();

    expect(() => connection.saveDatabase()).toThrowError(
      'Database not initialized. Call initializeDatabase() first.'
    );
  });

  it('closeDatabase saves and closes; getDatabase throws afterwards', async () => {
    const connection = await importConnectionModule();
    await connection.initializeDatabase();
    connection.executeRun('CREATE TABLE close_test (id INTEGER PRIMARY KEY)');

    connection.closeDatabase();

    expect(fs.existsSync(getDbFilePath())).toBe(true);
    expect(() => connection.getDatabase()).toThrowError(
      'Database not initialized. Call initializeDatabase() first.'
    );
  });

  it('recordImportMetadata stores filename and rows imported', async () => {
    const connection = await importConnectionModule();
    await initializeWithImportTable(connection);

    connection.recordImportMetadata('parks.csv', 42);

    const latest = connection.executeOne<{ filename: string; rows_imported: number }>(
      'SELECT filename, rows_imported FROM import_metadata ORDER BY id DESC LIMIT 1'
    );
    expect(latest).toEqual({ filename: 'parks.csv', rows_imported: 42 });
  });

  it('getLatestImportMetadata returns newest entry by imported_at', async () => {
    const connection = await importConnectionModule();
    await initializeWithImportTable(connection);

    connection.executeRun(
      'INSERT INTO import_metadata (filename, rows_imported, imported_at) VALUES (?, ?, ?)',
      ['older.csv', 10, '2026-01-01 00:00:00']
    );
    connection.executeRun(
      'INSERT INTO import_metadata (filename, rows_imported, imported_at) VALUES (?, ?, ?)',
      ['newer.csv', 20, '2026-01-02 00:00:00']
    );

    expect(connection.getLatestImportMetadata()).toEqual({
      filename: 'newer.csv',
      rows_imported: 20,
      imported_at: '2026-01-02 00:00:00',
    });
  });

  it('getAllImportMetadata returns all entries ordered by imported_at DESC', async () => {
    const connection = await importConnectionModule();
    await initializeWithImportTable(connection);

    connection.executeRun(
      'INSERT INTO import_metadata (filename, rows_imported, imported_at) VALUES (?, ?, ?)',
      ['first.csv', 1, '2026-01-01 00:00:00']
    );
    connection.executeRun(
      'INSERT INTO import_metadata (filename, rows_imported, imported_at) VALUES (?, ?, ?)',
      ['second.csv', 2, '2026-01-02 00:00:00']
    );

    const rows = connection.getAllImportMetadata();
    expect(rows).toHaveLength(2);
    expect(rows[0]?.filename).toBe('second.csv');
    expect(rows[1]?.filename).toBe('first.csv');
  });
});
