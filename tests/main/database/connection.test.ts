import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock electron module
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => path.join(os.tmpdir(), 'pota-test-' + Date.now())),
    on: vi.fn(),
  },
}));

// Helper to load sql.js with WASM binary for Node.js/Electron environment
async function loadSqlJs(): Promise<import('sql.js').SqlJsStatic> {
  const initSqlJs = (await import('sql.js')).default;
  const wasmPath = path.join(
    process.cwd(),
    'node_modules',
    'sql.js',
    'dist',
    'sql-wasm.wasm'
  );
  const wasmBuffer = fs.readFileSync(wasmPath);
  const wasmBinary = wasmBuffer.buffer.slice(
    wasmBuffer.byteOffset,
    wasmBuffer.byteOffset + wasmBuffer.byteLength
  );
  return initSqlJs({ wasmBinary });
}

describe('Database Connection Module', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Create temp directory for tests
    tempDir = path.join(os.tmpdir(), 'pota-test-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    // Set test environment
    process.env['NODE_ENV'] = 'test';
  });

  afterEach(() => {
    // Restore env
    process.env = originalEnv;

    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Reset modules
    vi.resetModules();
  });

  describe('sql.js initialization', () => {
    it('should initialize sql.js successfully', async () => {
      const SQL = await loadSqlJs();
      expect(SQL).toBeDefined();
      expect(SQL.Database).toBeDefined();
    });

    it('should create an in-memory database', async () => {
      const SQL = await loadSqlJs();
      const db = new SQL.Database();
      expect(db).toBeDefined();

      // Run a simple query
      const result = db.exec('SELECT 1 as value');
      expect(result).toHaveLength(1);
      expect(result[0]?.values[0]?.[0]).toBe(1);

      db.close();
    });

    it('should export and import database', async () => {
      const SQL = await loadSqlJs();

      // Create database with data
      const db1 = new SQL.Database();
      db1.run('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
      db1.run('INSERT INTO test (name) VALUES (?)', ['hello']);

      // Export
      const data = db1.export();
      db1.close();

      // Import into new database
      const db2 = new SQL.Database(data);
      const result = db2.exec('SELECT name FROM test');
      expect(result[0]?.values[0]?.[0]).toBe('hello');

      db2.close();
    });
  });

  describe('Database queries', () => {
    it('should execute CREATE TABLE statements', async () => {
      const SQL = await loadSqlJs();
      const db = new SQL.Database();

      db.run(`
        CREATE TABLE IF NOT EXISTS parks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reference TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL
        )
      `);

      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='parks'");
      expect(result).toHaveLength(1);

      db.close();
    });

    it('should execute INSERT statements', async () => {
      const SQL = await loadSqlJs();
      const db = new SQL.Database();

      db.run('CREATE TABLE parks (id INTEGER PRIMARY KEY, reference TEXT, name TEXT)');
      db.run('INSERT INTO parks (reference, name) VALUES (?, ?)', ['K-0039', 'Yellowstone NP']);

      const modified = db.getRowsModified();
      expect(modified).toBe(1);

      db.close();
    });

    it('should execute SELECT statements', async () => {
      const SQL = await loadSqlJs();
      const db = new SQL.Database();

      db.run('CREATE TABLE parks (id INTEGER PRIMARY KEY, reference TEXT, name TEXT)');
      db.run('INSERT INTO parks (reference, name) VALUES (?, ?)', ['K-0039', 'Yellowstone NP']);

      const result = db.exec('SELECT * FROM parks WHERE reference = ?', ['K-0039']);
      expect(result).toHaveLength(1);
      expect(result[0]?.columns).toEqual(['id', 'reference', 'name']);
      expect(result[0]?.values).toHaveLength(1);
      expect(result[0]?.values[0]?.[1]).toBe('K-0039');
      expect(result[0]?.values[0]?.[2]).toBe('Yellowstone NP');

      db.close();
    });
  });

  describe('Migrations table', () => {
    it('should create migrations table', async () => {
      const SQL = await loadSqlJs();
      const db = new SQL.Database();

      db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'");
      expect(result).toHaveLength(1);

      db.close();
    });

    it('should track applied migrations', async () => {
      const SQL = await loadSqlJs();
      const db = new SQL.Database();

      db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run('INSERT INTO migrations (name) VALUES (?)', ['initial-schema']);

      const result = db.exec('SELECT name FROM migrations');
      expect(result[0]?.values).toHaveLength(1);
      expect(result[0]?.values[0]?.[0]).toBe('initial-schema');

      db.close();
    });
  });

  describe('Initial schema tables', () => {
    it('should create all required tables', async () => {
      const SQL = await loadSqlJs();
      const db = new SQL.Database();

      // Create all tables from initial schema
      db.run(`
        CREATE TABLE IF NOT EXISTS parks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reference TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          grid_square TEXT,
          state TEXT,
          country TEXT,
          entity_id INTEGER,
          location_desc TEXT,
          is_active INTEGER DEFAULT 1,
          is_favorite INTEGER DEFAULT 0
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          park_id INTEGER NOT NULL,
          activation_date TEXT NOT NULL,
          start_time TEXT,
          end_time TEXT,
          equipment_preset_id INTEGER,
          bands TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (park_id) REFERENCES parks(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS weather_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          data TEXT NOT NULL,
          fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS user_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS import_metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          rows_imported INTEGER NOT NULL,
          imported_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS equipment_presets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          radio TEXT,
          antenna TEXT,
          power_watts INTEGER,
          notes TEXT,
          is_builtin INTEGER DEFAULT 0
        )
      `);

      // Verify all tables exist
      const tables = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );
      const tableNames = tables[0]?.values.map((v) => v[0] as string) ?? [];

      expect(tableNames).toContain('parks');
      expect(tableNames).toContain('plans');
      expect(tableNames).toContain('weather_cache');
      expect(tableNames).toContain('user_config');
      expect(tableNames).toContain('import_metadata');
      expect(tableNames).toContain('equipment_presets');

      db.close();
    });

    it('should insert built-in equipment presets', async () => {
      const SQL = await loadSqlJs();
      const db = new SQL.Database();

      db.run(`
        CREATE TABLE IF NOT EXISTS equipment_presets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          radio TEXT,
          antenna TEXT,
          power_watts INTEGER,
          notes TEXT,
          is_builtin INTEGER DEFAULT 0
        )
      `);

      db.run(
        'INSERT INTO equipment_presets (name, radio, antenna, power_watts, is_builtin) VALUES (?, ?, ?, ?, 1)',
        ['QRP Portable', 'Various', 'End-fed halfwave', 5]
      );
      db.run(
        'INSERT INTO equipment_presets (name, radio, antenna, power_watts, is_builtin) VALUES (?, ?, ?, ?, 1)',
        ['Standard Portable', 'Various', 'Dipole/Vertical', 30]
      );
      db.run(
        'INSERT INTO equipment_presets (name, radio, antenna, power_watts, is_builtin) VALUES (?, ?, ?, ?, 1)',
        ['Mobile High Power', 'Various', 'Mobile whip', 100]
      );

      const result = db.exec('SELECT name, power_watts FROM equipment_presets ORDER BY power_watts');
      expect(result[0]?.values).toHaveLength(3);
      expect(result[0]?.values[0]?.[0]).toBe('QRP Portable');
      expect(result[0]?.values[0]?.[1]).toBe(5);
      expect(result[0]?.values[1]?.[0]).toBe('Standard Portable');
      expect(result[0]?.values[1]?.[1]).toBe(30);
      expect(result[0]?.values[2]?.[0]).toBe('Mobile High Power');
      expect(result[0]?.values[2]?.[1]).toBe(100);

      db.close();
    });
  });
});
