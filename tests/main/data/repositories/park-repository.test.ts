import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParkReference } from '../../../../src/shared/types/park';

const {
  executeAllMock,
  executeOneMock,
  executeRunMock,
  executeScalarMock,
  saveDatabaseMock,
  getTimezoneMock,
} = vi.hoisted(() => ({
  executeAllMock: vi.fn(),
  executeOneMock: vi.fn(),
  executeRunMock: vi.fn(),
  executeScalarMock: vi.fn(),
  saveDatabaseMock: vi.fn(),
  getTimezoneMock: vi.fn(),
}));

vi.mock('../../../../src/main/database/connection', () => ({
  executeAll: executeAllMock,
  executeOne: executeOneMock,
  executeRun: executeRunMock,
  executeScalar: executeScalarMock,
  saveDatabase: saveDatabaseMock,
}));

vi.mock('../../../../src/main/services/timezone-service', () => ({
  getTimezone: getTimezoneMock,
}));

type ParkRepositoryModule = typeof import('../../../../src/main/data/repositories/park-repository');

interface ParkRowFixture {
  id: number;
  reference: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  grid_square: string | null;
  state: string | null;
  country: string | null;
  entity_id: number | null;
  location_desc: string | null;
  is_active: number;
  is_favorite: number;
  timezone: string | null;
}

function asParkReference(value: string): ParkReference {
  return value as ParkReference;
}

function createParkRow(overrides: Partial<ParkRowFixture> = {}): ParkRowFixture {
  return {
    id: 1,
    reference: 'K-0039',
    name: 'Yellowstone National Park',
    latitude: 44.428,
    longitude: -110.5885,
    grid_square: 'DN44',
    state: 'WY',
    country: 'US',
    entity_id: 291,
    location_desc: 'Wyoming',
    is_active: 1,
    is_favorite: 0,
    timezone: null,
    ...overrides,
  };
}

async function importParkRepository(): Promise<ParkRepositoryModule> {
  return import('../../../../src/main/data/repositories/park-repository');
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  executeAllMock.mockReturnValue([]);
  executeOneMock.mockReturnValue(null);
  executeRunMock.mockReturnValue(1);
  executeScalarMock.mockReturnValue(0);
  saveDatabaseMock.mockReturnValue(undefined);
  getTimezoneMock.mockReturnValue(null);
});

describe('main/data/repositories/park-repository', () => {
  it('searchParks builds query search SQL and returns matching parks', async () => {
    executeScalarMock.mockReturnValue(1);
    executeAllMock.mockReturnValue([
      createParkRow({ reference: 'K-0001', name: 'Yellow Ridge Preserve' }),
    ]);

    const repository = await importParkRepository();
    const result = repository.searchParks({ query: 'Yellow' });

    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(result.parks).toHaveLength(1);
    expect(result.parks[0]).toEqual(
      expect.objectContaining({
        reference: 'K-0001',
        name: 'Yellow Ridge Preserve',
        isFavorite: false,
      })
    );

    const [countSql, countParamsRaw] = executeScalarMock.mock.calls[0] as [string, unknown[]];
    const countParams = countParamsRaw ?? [];
    expect(countSql).toContain('(name LIKE ? OR reference LIKE ?)');
    expect(countParams.slice(0, 2)).toEqual(['%Yellow%', '%Yellow%']);

    const [dataSql, dataParamsRaw] = executeAllMock.mock.calls[0] as [string, unknown[]];
    const dataParams = dataParamsRaw ?? [];
    expect(dataSql).toContain('ORDER BY name ASC');
    expect(dataSql).toContain('LIMIT ? OFFSET ?');
    expect(dataParams.slice(-2)).toEqual([100, 0]);
  });

  it('searchParks applies entity, favorites, bounds, and pagination filters', async () => {
    executeScalarMock.mockReturnValue(10);
    executeAllMock.mockReturnValue(
      Array.from({ length: 5 }, (_, index) =>
        createParkRow({
          id: index + 1,
          reference: `K-10${index}`,
          name: `US Favorite Park ${index}`,
          country: 'US',
          is_favorite: 1,
        })
      )
    );

    const repository = await importParkRepository();
    const result = repository.searchParks({
      query: 'park',
      entityId: 'US',
      favoritesOnly: true,
      bounds: { minLat: 39, maxLat: 41, minLon: -106, maxLon: -104 },
      limit: 5,
      offset: 0,
    });

    expect(result.total).toBe(10);
    expect(result.parks).toHaveLength(5);
    expect(result.hasMore).toBe(true);

    const [countSql, countParamsRaw] = executeScalarMock.mock.calls[0] as [string, unknown[]];
    const countParams = countParamsRaw ?? [];
    expect(countSql).toContain('country = ?');
    expect(countSql).toContain('is_favorite = 1');
    expect(countSql).toContain(
      'latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?'
    );
    expect(countParams).toEqual(
      expect.arrayContaining(['%park%', 'US', 39, 41, -106, -104, 5, 0])
    );
  });

  it('searchParks returns empty result set when no rows match', async () => {
    executeScalarMock.mockReturnValue(0);
    executeAllMock.mockReturnValue([]);

    const repository = await importParkRepository();
    const result = repository.searchParks({ query: 'nonexistent', limit: 5, offset: 0 });

    expect(result).toEqual({ parks: [], total: 0, hasMore: false });
  });

  it('getParkByReference returns null when park does not exist', async () => {
    executeOneMock.mockReturnValue(null);

    const repository = await importParkRepository();
    const result = repository.getParkByReference(asParkReference('K-9999'));

    expect(result).toBeNull();
  });

  it('getParkByReference lazy-loads and stores timezone when missing', async () => {
    executeOneMock.mockReturnValue(createParkRow({ timezone: null }));
    getTimezoneMock.mockReturnValue('America/Denver');

    const repository = await importParkRepository();
    const result = repository.getParkByReference(asParkReference('K-0039'));

    expect(result?.timezone).toBe('America/Denver');
    expect(getTimezoneMock).toHaveBeenCalledWith(44.428, -110.5885);
    expect(executeRunMock).toHaveBeenCalledWith(
      'UPDATE parks SET timezone = ? WHERE reference = ?',
      ['America/Denver', 'K-0039']
    );
  });

  it('getParkByReference does not lazy-load timezone when already set', async () => {
    executeOneMock.mockReturnValue(createParkRow({ timezone: 'America/Chicago' }));

    const repository = await importParkRepository();
    const result = repository.getParkByReference(asParkReference('K-0039'));

    expect(result?.timezone).toBe('America/Chicago');
    expect(getTimezoneMock).not.toHaveBeenCalled();
    expect(executeRunMock).not.toHaveBeenCalled();
  });

  it('getParkByReference skips timezone load when coordinates are null', async () => {
    executeOneMock.mockReturnValue(
      createParkRow({ latitude: null, longitude: null, timezone: null })
    );

    const repository = await importParkRepository();
    const result = repository.getParkByReference(asParkReference('K-0039'));

    expect(result?.timezone).toBeUndefined();
    expect(getTimezoneMock).not.toHaveBeenCalled();
    expect(executeRunMock).not.toHaveBeenCalled();
  });

  it('toggleFavorite switches unfavorited parks to favorited and saves', async () => {
    executeOneMock.mockReturnValue(createParkRow({ is_favorite: 0, timezone: 'America/Denver' }));
    executeRunMock.mockReturnValue(1);

    const repository = await importParkRepository();
    const result = repository.toggleFavorite(asParkReference('K-0039'));

    expect(result).toEqual({ reference: 'K-0039', isFavorite: true });
    expect(executeRunMock).toHaveBeenCalledWith(
      'UPDATE parks SET is_favorite = ? WHERE reference = ?',
      [1, 'K-0039']
    );
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);
  });

  it('toggleFavorite switches favorited parks to unfavorited', async () => {
    executeOneMock.mockReturnValue(createParkRow({ is_favorite: 1, timezone: 'America/Denver' }));
    executeRunMock.mockReturnValue(1);

    const repository = await importParkRepository();
    const result = repository.toggleFavorite(asParkReference('K-0039'));

    expect(result).toEqual({ reference: 'K-0039', isFavorite: false });
    expect(executeRunMock).toHaveBeenCalledWith(
      'UPDATE parks SET is_favorite = ? WHERE reference = ?',
      [0, 'K-0039']
    );
  });

  it('toggleFavorite returns null for missing parks or failed updates', async () => {
    executeOneMock.mockReturnValue(null);

    const repository = await importParkRepository();
    const missing = repository.toggleFavorite(asParkReference('K-9999'));

    expect(missing).toBeNull();
    expect(executeRunMock).not.toHaveBeenCalled();
    expect(saveDatabaseMock).not.toHaveBeenCalled();

    executeOneMock.mockReturnValue(createParkRow({ timezone: 'America/Denver' }));
    executeRunMock.mockReturnValue(0);

    const failed = repository.toggleFavorite(asParkReference('K-0039'));
    expect(failed).toBeNull();
    expect(saveDatabaseMock).not.toHaveBeenCalled();
  });

  it('insertPark uses INSERT OR REPLACE and returns last inserted row id', async () => {
    executeScalarMock.mockReturnValue(77);

    const repository = await importParkRepository();
    const id = repository.insertPark({
      reference: 'K-0050',
      name: 'Insert Test Park',
      latitude: 40.5,
      longitude: -105.1,
      grid_square: 'DN70',
      state: 'CO',
      country: 'US',
      entity_id: 291,
      location_desc: 'Colorado',
      is_active: 1,
      is_favorite: 0,
      timezone: 'America/Denver',
    });

    expect(id).toBe(77);
    expect(executeRunMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO parks'),
      expect.any(Array)
    );
    expect(executeScalarMock).toHaveBeenCalledWith('SELECT last_insert_rowid()');
  });

  it('countParks returns count and defaults to zero when scalar is null', async () => {
    executeScalarMock.mockReturnValueOnce(42).mockReturnValueOnce(null);

    const repository = await importParkRepository();
    expect(repository.countParks()).toBe(42);
    expect(repository.countParks()).toBe(0);
  });

  it('clearAllParks deletes all rows and saves database', async () => {
    const repository = await importParkRepository();
    repository.clearAllParks();

    expect(executeRunMock).toHaveBeenCalledWith('DELETE FROM parks');
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);
  });
});
