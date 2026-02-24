import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWeatherData } from '../../../helpers/fixtures';

const { executeOneMock, executeRunMock, saveDatabaseMock } = vi.hoisted(() => ({
  executeOneMock: vi.fn(),
  executeRunMock: vi.fn(),
  saveDatabaseMock: vi.fn(),
}));

vi.mock('../../../../src/main/database/connection', () => ({
  executeOne: executeOneMock,
  executeRun: executeRunMock,
  saveDatabase: saveDatabaseMock,
}));

type WeatherCacheRepositoryModule =
  typeof import('../../../../src/main/data/repositories/weather-cache-repository');

async function importWeatherCacheRepository(): Promise<WeatherCacheRepositoryModule> {
  return import('../../../../src/main/data/repositories/weather-cache-repository');
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-03-01T12:00:00.000Z'));

  executeOneMock.mockReturnValue(null);
  executeRunMock.mockReturnValue(0);
  saveDatabaseMock.mockReturnValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('main/data/repositories/weather-cache-repository', () => {
  it('returns cached weather within TTL and rounds lookup coordinates', async () => {
    const weather = createWeatherData();
    executeOneMock.mockReturnValue({
      id: 1,
      latitude: 39.74,
      longitude: -104.99,
      data: JSON.stringify(weather),
      fetched_at: '2026-03-01T11:45:00.000Z',
    });

    const repository = await importWeatherCacheRepository();
    const result = repository.getCachedWeather(39.7392, -104.9903);

    expect(result).toEqual(weather);
    expect(executeOneMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE latitude = ? AND longitude = ?'),
      [39.74, -104.99]
    );
  });

  it('returns null when cache is expired, missing, or malformed', async () => {
    executeOneMock.mockReturnValueOnce({
      id: 1,
      latitude: 39.74,
      longitude: -104.99,
      data: JSON.stringify(createWeatherData()),
      fetched_at: '2026-03-01T10:00:00.000Z',
    });

    const repository = await importWeatherCacheRepository();
    const expired = repository.getCachedWeather(39.7392, -104.9903);
    expect(expired).toBeNull();

    executeOneMock.mockReturnValueOnce(null);
    const missing = repository.getCachedWeather(39.7392, -104.9903);
    expect(missing).toBeNull();

    executeOneMock.mockReturnValueOnce({
      id: 2,
      latitude: 39.74,
      longitude: -104.99,
      data: '{invalid',
      fetched_at: '2026-03-01T11:45:00.000Z',
    });
    const malformed = repository.getCachedWeather(39.7392, -104.9903);
    expect(malformed).toBeNull();
  });

  it('setCachedWeather writes rounded coordinates with INSERT OR REPLACE and saves', async () => {
    const weather = createWeatherData();

    const repository = await importWeatherCacheRepository();
    repository.setCachedWeather(39.7392, -104.9903, weather);

    const [sql, params] = executeRunMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT OR REPLACE INTO weather_cache');
    expect(params[0]).toBe(39.74);
    expect(params[1]).toBe(-104.99);
    expect(params[2]).toBe(JSON.stringify(weather));
    expect(params[3]).toBe('2026-03-01T12:00:00.000Z');
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);
  });

  it('clearExpiredWeatherCache deletes expired entries and saves only when rows are removed', async () => {
    executeRunMock.mockReturnValueOnce(2).mockReturnValueOnce(0);

    const repository = await importWeatherCacheRepository();

    const deleted = repository.clearExpiredWeatherCache();
    expect(deleted).toBe(2);
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);
    expect(executeRunMock.mock.calls[0]?.[0]).toContain('DELETE FROM weather_cache');
    expect(executeRunMock.mock.calls[0]?.[1]).toEqual(['2026-03-01T11:00:00.000Z']);

    const noneDeleted = repository.clearExpiredWeatherCache();
    expect(noneDeleted).toBe(0);
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);
  });

  it('clearAllWeatherCache removes all rows and persists the delete', async () => {
    const repository = await importWeatherCacheRepository();
    repository.clearAllWeatherCache();

    expect(executeRunMock).toHaveBeenCalledWith('DELETE FROM weather_cache');
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);
  });
});
