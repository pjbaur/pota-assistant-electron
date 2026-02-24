import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import initSqlJs from 'sql.js';
import type { Database, SqlValue } from 'sql.js';
import { createParkReference } from '../../src/shared/types';
import { createPlanInput } from '../helpers/fixtures';
import { seedParks } from '../helpers/db-test-helper';

let db: Database;
let cleanup: () => void;
const require = createRequire(import.meta.url);

const MIGRATION_FILES = [
  '001-initial-schema.sql',
  '002-plan-enhancements.sql',
  '003-add-park-timezone.sql',
] as const;

async function createIntegrationDatabase(): Promise<{ db: Database; cleanup: () => void }> {
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({
    wasmBinary: new Uint8Array(wasmBuffer.buffer, wasmBuffer.byteOffset, wasmBuffer.byteLength),
  });

  const database = new SQL.Database();

  for (const migrationFile of MIGRATION_FILES) {
    const migrationPath = path.join(
      process.cwd(),
      'src',
      'main',
      'database',
      'migrations',
      migrationFile
    );
    database.exec(fs.readFileSync(migrationPath, 'utf-8'));
  }

  let isClosed = false;
  return {
    db: database,
    cleanup: () => {
      if (!isClosed) {
        database.close();
        isClosed = true;
      }
    },
  };
}

function toSqlParams(params: unknown[]): SqlValue[] {
  return params as SqlValue[];
}

function executeAllFromDb<T>(sql: string, params: unknown[] = []): T[] {
  const statement = db.prepare(sql, toSqlParams(params));
  const rows: T[] = [];

  while (statement.step()) {
    rows.push(statement.getAsObject() as T);
  }

  statement.free();
  return rows;
}

function executeOneFromDb<T>(sql: string, params: unknown[] = []): T | null {
  const rows = executeAllFromDb<T>(sql, params);
  return rows[0] ?? null;
}

function executeScalarFromDb<T>(sql: string, params: unknown[] = []): T | null {
  const statement = db.prepare(sql, toSqlParams(params));
  const hasRow = statement.step();

  if (!hasRow) {
    statement.free();
    return null;
  }

  const value = statement.get()[0] as T | undefined;
  statement.free();

  return value ?? null;
}

function executeRunFromDb(sql: string, params: unknown[] = []): number {
  db.run(sql, toSqlParams(params));
  return db.getRowsModified();
}

beforeEach(async () => {
  vi.resetModules();

  const context = await createIntegrationDatabase();
  db = context.db;
  cleanup = context.cleanup;

  vi.doMock('../../src/main/database/connection', () => ({
    executeAll: executeAllFromDb,
    executeOne: executeOneFromDb,
    executeRun: executeRunFromDb,
    executeScalar: executeScalarFromDb,
    saveDatabase: vi.fn(),
  }));

  vi.doMock('../../src/main/services/timezone-service', () => ({
    getTimezone: () => 'America/Denver',
  }));
});

afterEach(() => {
  cleanup?.();
  vi.resetModules();
});

describe('integration/repository-with-db', () => {
  it('searches parks and persists favorite toggles through the park repository', async () => {
    const seededParks = seedParks(db, 2);
    const firstPark = seededParks[0];

    if (firstPark === undefined) {
      throw new Error('Expected seeded park data');
    }

    const parkRepository = await import('../../src/main/data/repositories/park-repository');

    const searchResult = parkRepository.searchParks({ query: 'Yellowstone' });
    expect(searchResult.total).toBe(1);
    expect(searchResult.parks[0]?.reference).toBe(firstPark.reference);

    const toggleResult = parkRepository.toggleFavorite(createParkReference(firstPark.reference));
    expect(toggleResult).toEqual({ reference: firstPark.reference, isFavorite: true });

    const reloaded = parkRepository.getParkByReference(createParkReference(firstPark.reference));
    expect(reloaded?.isFavorite).toBe(true);
  });

  it('creates and retrieves plans through the plan repository with real SQL storage', async () => {
    const seededParks = seedParks(db, 1);
    const firstPark = seededParks[0];

    if (firstPark === undefined) {
      throw new Error('Expected seeded park data');
    }

    const planRepository = await import('../../src/main/data/repositories/plan-repository');

    const input = createPlanInput({
      parkReference: createParkReference(firstPark.reference),
    });

    const created = planRepository.createPlan(input);
    expect(created).not.toBeNull();
    expect(created?.parkReference).toBe(firstPark.reference);

    if (created === null) {
      throw new Error('Expected created plan');
    }

    const listed = planRepository.listPlans({});
    expect(listed.total).toBe(1);
    expect(listed.plans[0]?.id).toBe(created.id);

    const fetched = planRepository.getPlanById(created.id);
    expect(fetched?.parkReference).toBe(firstPark.reference);
    expect(fetched?.name).toBe(input.name);
  });
});
