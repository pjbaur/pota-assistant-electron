import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  importParksFromCsv,
  parseCsvFile,
  type ProgressCallback,
} from '../../../src/main/services/csv-import-service';

const HEADER = 'reference,name,active,entityId,locationDesc,latitude,longitude,grid';

function buildRow(overrides: Partial<Record<string, string>> = {}): string {
  const row = {
    reference: 'K-0039',
    name: 'Yellowstone National Park',
    active: '1',
    entityId: '291',
    locationDesc: 'Wyoming US',
    latitude: '44.4280',
    longitude: '-110.5885',
    grid: 'DN44',
    ...overrides,
  };

  return [
    row.reference,
    row.name,
    row.active,
    row.entityId,
    row.locationDesc,
    row.latitude,
    row.longitude,
    row.grid,
  ].join(',');
}

function writeTempCsv(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pota-csv-test-'));
  const filePath = path.join(dir, 'parks.csv');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function cleanupTempFile(filePath: string): void {
  fs.rmSync(path.dirname(filePath), { recursive: true, force: true });
}

describe('main/services/csv-import-service', () => {
  const filesToCleanup: string[] = [];

  afterEach(() => {
    for (const filePath of filesToCleanup) {
      cleanupTempFile(filePath);
    }
    filesToCleanup.length = 0;
  });

  it('parses comma-separated lines, quoted commas, escaped quotes, and trims fields', async () => {
    const quotedRow = [
      ' "K-0039" ',
      ' "Mount ""Rainier"", WA" ',
      ' "true" ',
      ' "291" ',
      ' "Washington, US" ',
      ' "46.8523" ',
      ' "-121.7603" ',
      ' "CN96" ',
    ].join(',');

    const filePath = writeTempCsv(`${HEADER}\n${quotedRow}\n`);
    filesToCleanup.push(filePath);

    const result = await parseCsvFile(filePath);

    expect(result.validRows).toBe(1);
    expect(result.invalidRows).toBe(0);
    expect(result.parks[0]).toMatchObject({
      reference: 'K-0039',
      name: 'Mount "Rainier", WA',
      is_active: 1,
      latitude: 46.8523,
      longitude: -121.7603,
      grid_square: 'CN96',
      state: 'Washington',
      country: 'US',
    });
  });

  it('validates references, grid square, coordinates, and required fields', async () => {
    const rows = [
      buildRow({ reference: 'VE-1234', grid: 'DN44xk', name: 'Valid Park' }),
      buildRow({ reference: 'K0039' }),
      buildRow({ reference: '', name: '' }),
      buildRow({ grid: 'D4' }),
      buildRow({ latitude: '91.0' }),
      buildRow({ longitude: '200.0' }),
    ];

    const filePath = writeTempCsv(`${HEADER}\n${rows.join('\n')}\n`);
    filesToCleanup.push(filePath);

    const result = await parseCsvFile(filePath);

    expect(result.totalRows).toBe(6);
    expect(result.validRows).toBe(1);
    expect(result.invalidRows).toBe(5);
    expect(result.errors.some((err) => err.errors.some((msg) => msg.includes('Invalid park reference format')))).toBe(true);
    expect(result.errors.some((err) => err.errors.some((msg) => msg.includes('Missing required field: reference')))).toBe(true);
    expect(result.errors.some((err) => err.errors.some((msg) => msg.includes('Missing required field: name')))).toBe(true);
    expect(result.errors.some((err) => err.errors.some((msg) => msg.includes('Invalid grid square format')))).toBe(true);
    expect(result.errors.some((err) => err.errors.some((msg) => msg.includes('Invalid latitude')))).toBe(true);
    expect(result.errors.some((err) => err.errors.some((msg) => msg.includes('Invalid longitude')))).toBe(true);
  });

  it('parses active status values of 1 and true to active records', async () => {
    const rows = [
      buildRow({ active: '1' }),
      buildRow({ reference: 'K-0040', active: 'true' }),
    ];

    const filePath = writeTempCsv(`${HEADER}\n${rows.join('\n')}\n`);
    filesToCleanup.push(filePath);

    const result = await parseCsvFile(filePath);

    expect(result.parks.map((park) => park.is_active)).toEqual([1, 1]);
  });

  it('parses well-formed files, skips empty lines, and reports line numbers for invalid rows', async () => {
    const filePath = writeTempCsv(
      `${HEADER}\n${buildRow()}\n\n${buildRow({ reference: 'INVALID' })}\n${buildRow({ reference: 'K-0041' })}\n`
    );
    filesToCleanup.push(filePath);

    const result = await parseCsvFile(filePath);

    expect(result.totalRows).toBe(3);
    expect(result.validRows).toBe(2);
    expect(result.invalidRows).toBe(1);
    expect(result.errors[0]?.lineNumber).toBe(4);
  });

  it('reports parsing progress for large files at chunk boundaries', async () => {
    const rowCount = 1001;
    const rows = Array.from({ length: rowCount }, (_, index) =>
      buildRow({ reference: `K-${String(3000 + index).padStart(4, '0')}` })
    );

    const filePath = writeTempCsv(`${HEADER}\n${rows.join('\n')}\n`);
    filesToCleanup.push(filePath);

    const onProgress = vi.fn<ProgressCallback>();
    const result = await parseCsvFile(filePath, onProgress);

    expect(result.totalRows).toBe(rowCount);
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'parsing',
        recordsProcessed: 1000,
        totalRecords: 0,
      })
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'parsing',
        recordsProcessed: rowCount,
        totalRecords: rowCount,
        message: 'Parsing complete',
      })
    );
  });

  it('imports in 500-record batches and reports full phase transitions', async () => {
    const rowCount = 1201;
    const rows = Array.from({ length: rowCount }, (_, index) =>
      buildRow({ reference: `K-${String(5000 + index).padStart(4, '0')}` })
    );

    const filePath = writeTempCsv(`${HEADER}\n${rows.join('\n')}\n`);
    filesToCleanup.push(filePath);

    const insertBatch = vi.fn((parks: Array<Record<string, unknown>>) => parks.length);
    const progressEvents: string[] = [];

    const result = await importParksFromCsv(filePath, insertBatch, (progress) => {
      progressEvents.push(progress.phase);
    });

    expect(insertBatch).toHaveBeenCalledTimes(3);
    expect(insertBatch.mock.calls[0]?.[0]).toHaveLength(500);
    expect(insertBatch.mock.calls[1]?.[0]).toHaveLength(500);
    expect(insertBatch.mock.calls[2]?.[0]).toHaveLength(201);

    expect(result.imported).toBe(rowCount);
    expect(result.skipped).toBe(0);
    expect(progressEvents).toContain('reading');
    expect(progressEvents).toContain('parsing');
    expect(progressEvents).toContain('importing');
    expect(progressEvents).toContain('completed');
  });

  it('returns zero imports for header-only files', async () => {
    const filePath = writeTempCsv(`${HEADER}\n`);
    filesToCleanup.push(filePath);

    const insertBatch = vi.fn(() => 0);
    const result = await importParksFromCsv(filePath, insertBatch);

    expect(result.totalRows).toBe(0);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
    expect(insertBatch).not.toHaveBeenCalled();
  });

  it('returns mixed import counts and skip totals', async () => {
    const filePath = writeTempCsv(
      `${HEADER}\n${buildRow()}\n${buildRow({ reference: 'INVALID' })}\n${buildRow({ reference: 'K-0042' })}\n`
    );
    filesToCleanup.push(filePath);

    const insertBatch = vi.fn((parks: Array<Record<string, unknown>>) => parks.length);
    const result = await importParksFromCsv(filePath, insertBatch);

    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.validRows).toBe(2);
    expect(result.invalidRows).toBe(1);
  });

  it('rejects when the CSV file path does not exist', async () => {
    await expect(
      parseCsvFile('/definitely/missing/path/parks.csv')
    ).rejects.toThrow();
  });
});
