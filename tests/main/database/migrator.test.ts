import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  executeRunMock,
  executeAllMock,
  executeScalarMock,
  saveDatabaseMock,
  readdirSyncMock,
  readFileSyncMock,
} = vi.hoisted(() => ({
  executeRunMock: vi.fn(),
  executeAllMock: vi.fn(),
  executeScalarMock: vi.fn(),
  saveDatabaseMock: vi.fn(),
  readdirSyncMock: vi.fn(),
  readFileSyncMock: vi.fn(),
}));

vi.mock('fs', () => ({
  readdirSync: readdirSyncMock,
  readFileSync: readFileSyncMock,
}));

vi.mock('../../../src/main/database/connection', () => ({
  executeRun: executeRunMock,
  executeAll: executeAllMock,
  executeScalar: executeScalarMock,
  saveDatabase: saveDatabaseMock,
}));

type MigratorModule = typeof import('../../../src/main/database/migrator');

async function importMigratorModule(): Promise<MigratorModule> {
  return import('../../../src/main/database/migrator');
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();

  executeRunMock.mockReturnValue(1);
  executeAllMock.mockReturnValue([]);
  executeScalarMock.mockReturnValue(0);
  saveDatabaseMock.mockReturnValue(undefined);
  readdirSyncMock.mockReturnValue([]);
  readFileSyncMock.mockReturnValue('');

  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('main/database/migrator', () => {
  it('parses 001-initial-schema.sql as version 1 and name initial-schema', async () => {
    readdirSyncMock.mockReturnValue(['001-initial-schema.sql']);
    readFileSyncMock.mockReturnValue('CREATE TABLE test_a (id INTEGER);');

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(1);
    expect(executeRunMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO migrations (name) VALUES (?)'),
      ['initial-schema']
    );
  });

  it('parses 010-some-migration.sql as version 10', async () => {
    readdirSyncMock.mockReturnValue(['010-some-migration.sql']);
    readFileSyncMock.mockReturnValue('CREATE TABLE test_b (id INTEGER);');

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(1);
    expect(executeRunMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO migrations (name) VALUES (?)'),
      ['some-migration']
    );
  });

  it('ignores non-SQL files like readme.txt', async () => {
    readdirSyncMock.mockReturnValue(['readme.txt']);

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(0);
    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it('ignores invalid filenames without numeric prefix', async () => {
    readdirSyncMock.mockReturnValue(['abc-no-number.sql']);

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(0);
    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it('splits multi-statement SQL and executes each statement', async () => {
    readdirSyncMock.mockReturnValue(['001-multi.sql']);
    readFileSyncMock.mockReturnValue('CREATE TABLE a (id INTEGER); INSERT INTO a VALUES (1);');

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(1);
    expect(executeRunMock).toHaveBeenCalledWith('CREATE TABLE a (id INTEGER)');
    expect(executeRunMock).toHaveBeenCalledWith('INSERT INTO a VALUES (1)');
  });

  it('handles semicolons inside quoted strings without splitting incorrectly', async () => {
    readdirSyncMock.mockReturnValue(['001-quoted.sql']);
    readFileSyncMock.mockReturnValue(
      "CREATE TABLE notes (value TEXT); INSERT INTO notes (value) VALUES ('it''s a test; still string');"
    );

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(1);
    expect(executeRunMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO notes (value) VALUES ('it''s a test; still string')")
    );
  });

  it('handles SQL statement without trailing semicolon', async () => {
    readdirSyncMock.mockReturnValue(['001-no-trailing-semicolon.sql']);
    readFileSyncMock.mockReturnValue('CREATE TABLE no_semicolon (id INTEGER)');

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(1);
    expect(executeRunMock).toHaveBeenCalledWith('CREATE TABLE no_semicolon (id INTEGER)');
  });

  it('runMigrations applies all pending migrations in version order', async () => {
    readdirSyncMock.mockReturnValue(['010-second.sql', '001-first.sql']);
    readFileSyncMock.mockImplementation((filePath: string) => {
      if (filePath.endsWith('001-first.sql')) {
        return 'CREATE TABLE first_table (id INTEGER);';
      }
      if (filePath.endsWith('010-second.sql')) {
        return 'CREATE TABLE second_table (id INTEGER);';
      }
      return '';
    });

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(2);
    const sqlCalls = executeRunMock.mock.calls.map((call) => call[0] as string);
    const firstIndex = sqlCalls.findIndex((sql) =>
      sql.includes('CREATE TABLE first_table (id INTEGER)')
    );
    const secondIndex = sqlCalls.findIndex((sql) =>
      sql.includes('CREATE TABLE second_table (id INTEGER)')
    );
    expect(firstIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeGreaterThan(firstIndex);
  });

  it('runMigrations skips already applied migrations', async () => {
    readdirSyncMock.mockReturnValue(['001-initial-schema.sql', '002-next.sql']);
    readFileSyncMock.mockImplementation((filePath: string) => {
      if (filePath.endsWith('001-initial-schema.sql')) {
        return 'CREATE TABLE skipped_table (id INTEGER);';
      }
      return 'CREATE TABLE next_table (id INTEGER);';
    });
    executeAllMock.mockReturnValue([{ name: 'initial-schema' }]);

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(1);
    expect(executeRunMock).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE next_table (id INTEGER)')
    );
    expect(executeRunMock).not.toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE skipped_table (id INTEGER)')
    );
  });

  it('runMigrations returns 0 when there are no pending migrations', async () => {
    readdirSyncMock.mockReturnValue(['001-initial-schema.sql']);
    readFileSyncMock.mockReturnValue('CREATE TABLE already_done (id INTEGER);');
    executeAllMock.mockReturnValue([{ name: 'initial-schema' }]);

    const migrator = await importMigratorModule();
    const applied = migrator.runMigrations();

    expect(applied).toBe(0);
  });

  it('runMigrations rolls back a failed migration and re-throws', async () => {
    readdirSyncMock.mockReturnValue(['001-broken.sql']);
    readFileSyncMock.mockReturnValue('CREATE TABLE ok_table (id INTEGER); BROKEN SQL;');
    executeRunMock.mockImplementation((sql: string) => {
      if (sql === 'BROKEN SQL') {
        throw new Error('boom');
      }
      return 1;
    });

    const migrator = await importMigratorModule();

    expect(() => migrator.runMigrations()).toThrowError(
      'Failed to apply migration 001-broken.sql: boom'
    );
    expect(executeRunMock).toHaveBeenCalledWith('ROLLBACK');
  });

  it('runMigrations records each applied migration', async () => {
    readdirSyncMock.mockReturnValue(['001-one.sql', '002-two.sql']);
    readFileSyncMock.mockImplementation((filePath: string) => {
      if (filePath.endsWith('001-one.sql')) {
        return 'CREATE TABLE one_table (id INTEGER);';
      }
      return 'CREATE TABLE two_table (id INTEGER);';
    });

    const migrator = await importMigratorModule();
    migrator.runMigrations();

    const migrationInsertCalls = executeRunMock.mock.calls.filter((call) =>
      String(call[0]).includes('INSERT INTO migrations (name) VALUES (?)')
    );
    expect(migrationInsertCalls).toHaveLength(2);
    expect(migrationInsertCalls[0]?.[1]).toEqual(['one']);
    expect(migrationInsertCalls[1]?.[1]).toEqual(['two']);
  });

  it('getMigrationStatus reports applied and pending counts', async () => {
    readdirSyncMock.mockReturnValue(['001-one.sql', '002-two.sql', '003-three.sql']);
    readFileSyncMock.mockImplementation(() => 'SELECT 1;');
    executeAllMock.mockReturnValue([{ name: 'one' }, { name: 'three' }]);

    const migrator = await importMigratorModule();
    const status = migrator.getMigrationStatus();

    expect(status).toEqual({ applied: 2, pending: 1 });
  });

  it('getSchemaVersion returns highest applied migration version or 0', async () => {
    const migrator = await importMigratorModule();

    executeScalarMock.mockReturnValueOnce(7);
    expect(migrator.getSchemaVersion()).toBe(7);

    executeScalarMock.mockReturnValueOnce(null);
    expect(migrator.getSchemaVersion()).toBe(0);
  });
});
