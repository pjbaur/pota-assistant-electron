import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fetchWeatherDataMock,
  getCachedWeatherMock,
  setCachedWeatherMock,
} = vi.hoisted(() => ({
  fetchWeatherDataMock: vi.fn(),
  getCachedWeatherMock: vi.fn(),
  setCachedWeatherMock: vi.fn(),
}));

vi.mock('../../../src/main/api/weather-client', async () => {
  const actual = await vi.importActual<typeof import('../../../src/main/api/weather-client')>(
    '../../../src/main/api/weather-client'
  );

  return {
    ...actual,
    fetchWeatherData: fetchWeatherDataMock,
  };
});

vi.mock('../../../src/main/data/repositories/weather-cache-repository', () => ({
  getCachedWeather: getCachedWeatherMock,
  setCachedWeather: setCachedWeatherMock,
}));

import { createWeatherData } from '../../helpers/fixtures';
import { degreesToCardinal, getWeather } from '../../../src/main/services/weather-service';

function createApiResponse() {
  return {
    latitude: 44.428,
    longitude: -110.5885,
    generationtime_ms: 0.1,
    utc_offset_seconds: -25200,
    timezone: 'America/Denver',
    timezone_abbreviation: 'MST',
    elevation: 1500,
    hourly: {
      time: [
        '2026-06-15T00:00',
        '2026-06-15T01:00',
        '2026-06-15T02:00',
        '2026-06-16T00:00',
      ],
      temperature_2m: [0, 100, 20, 10],
      relative_humidity_2m: [50, 40, 30, 60],
      wind_speed_10m: [10, 12, 8, 5],
      wind_direction_10m: [0, 90, 180, 270],
      precipitation_probability: [10, 80, 20, 40],
      weather_code: [0, 61, 95, 3],
      uv_index: [1, 2, 5, 0],
    },
    daily: {
      time: ['2026-06-15', '2026-06-16'],
      temperature_2m_max: [26, 22],
      temperature_2m_min: [14, 8],
      precipitation_sum: [2.5, 0],
      weather_code: [95, 3],
      sunrise: ['2026-06-15T05:30:00', '2026-06-16T05:31:00'],
      sunset: ['2026-06-15T20:25:00', '2026-06-16T20:25:00'],
      uv_index_max: [7, 4],
      wind_speed_10m_max: [24, 20],
    },
  };
}

describe('main/services/weather-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns cached data on cache hit without calling API', async () => {
    const cached = createWeatherData();
    getCachedWeatherMock.mockReturnValue(cached);

    const result = await getWeather({ latitude: 44.4, longitude: -110.5 });

    expect(result).toBe(cached);
    expect(fetchWeatherDataMock).not.toHaveBeenCalled();
    expect(setCachedWeatherMock).not.toHaveBeenCalled();
  });

  it('calls API on cache miss, transforms data, and stores it in cache', async () => {
    getCachedWeatherMock.mockReturnValue(null);
    fetchWeatherDataMock.mockResolvedValue(createApiResponse());

    const result = await getWeather({
      latitude: 44.428,
      longitude: -110.5885,
      hourlyCount: 3,
      dailyCount: 2,
    });

    expect(fetchWeatherDataMock).toHaveBeenCalledWith(44.428, -110.5885, 2);
    expect(result).not.toBeNull();
    expect(result?.hourly).toHaveLength(3);
    expect(result?.daily).toHaveLength(2);
    expect(setCachedWeatherMock).toHaveBeenCalledWith(44.428, -110.5885, result);
  });

  it('applies conversion and weather-code mapping logic', async () => {
    getCachedWeatherMock.mockReturnValue(null);
    fetchWeatherDataMock.mockResolvedValue(createApiResponse());

    const result = await getWeather({ latitude: 44.428, longitude: -110.5885, hourlyCount: 3, dailyCount: 1 });

    expect(result?.hourly[0]?.temperatureC).toBe(0);
    expect(result?.hourly[0]?.temperatureF).toBe(32);
    expect(result?.hourly[1]?.temperatureC).toBe(100);
    expect(result?.hourly[1]?.temperatureF).toBe(212);
    expect(result?.hourly[0]?.condition).toBe('clear');
    expect(result?.hourly[1]?.condition).toBe('rain');
    expect(result?.hourly[2]?.condition).toBe('thunderstorm');
    expect(result?.daily[0]?.condition).toBe('thunderstorm');
  });

  it('limits forecast lengths using hourlyCount and dailyCount', async () => {
    getCachedWeatherMock.mockReturnValue(null);
    fetchWeatherDataMock.mockResolvedValue(createApiResponse());

    const result = await getWeather({ latitude: 40, longitude: -105, hourlyCount: 2, dailyCount: 1 });

    expect(result?.hourly).toHaveLength(2);
    expect(result?.daily).toHaveLength(1);
  });

  it('returns null on API failure and does not write cache', async () => {
    getCachedWeatherMock.mockReturnValue(null);
    fetchWeatherDataMock.mockResolvedValue(null);

    const result = await getWeather({ latitude: 40, longitude: -105 });

    expect(result).toBeNull();
    expect(setCachedWeatherMock).not.toHaveBeenCalled();
  });

  it('returns null when API response cannot be transformed', async () => {
    getCachedWeatherMock.mockReturnValue(null);
    fetchWeatherDataMock.mockResolvedValue({ timezone: 'America/Denver' });

    const result = await getWeather({ latitude: 40, longitude: -105 });

    expect(result).toBeNull();
    expect(setCachedWeatherMock).not.toHaveBeenCalled();
  });

  it('maps degrees to expected cardinal directions', () => {
    expect(degreesToCardinal(0)).toBe('N');
    expect(degreesToCardinal(45)).toBe('NE');
    expect(degreesToCardinal(90)).toBe('E');
    expect(degreesToCardinal(180)).toBe('S');
    expect(degreesToCardinal(270)).toBe('W');
    expect(degreesToCardinal(315)).toBe('NW');
  });
});
