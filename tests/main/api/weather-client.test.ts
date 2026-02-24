import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWeatherData, weatherCodeToCondition } from '../../../src/main/api/weather-client';

describe('main/api/weather-client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('weatherCodeToCondition', () => {
    it('maps known WMO codes and falls back to clear', () => {
      expect(weatherCodeToCondition(0)).toBe('clear');
      expect(weatherCodeToCondition(3)).toBe('cloudy');
      expect(weatherCodeToCondition(45)).toBe('fog');
      expect(weatherCodeToCondition(61)).toBe('rain');
      expect(weatherCodeToCondition(71)).toBe('snow');
      expect(weatherCodeToCondition(95)).toBe('thunderstorm');
      expect(weatherCodeToCondition(999)).toBe('clear');
    });
  });

  describe('fetchWeatherData', () => {
    it('constructs the correct URL and request options', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          timezone: 'America/Denver',
          hourly: { time: [] },
          daily: { time: [] },
        }),
      });

      await fetchWeatherData(39.73921234, -104.99039876);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [requestUrl, requestOptions] = fetchMock.mock.calls[0] ?? [];
      expect(typeof requestUrl).toBe('string');
      expect(requestOptions).toMatchObject({
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const url = new URL(requestUrl as string);
      expect(url.origin).toBe('https://api.open-meteo.com');
      expect(url.pathname).toBe('/v1/forecast');
      expect(url.searchParams.get('latitude')).toBe('39.7392');
      expect(url.searchParams.get('longitude')).toBe('-104.9904');
      expect(url.searchParams.get('timezone')).toBe('auto');
      expect(url.searchParams.get('forecast_days')).toBe('7');
      expect(url.searchParams.get('hourly')).toContain('temperature_2m');
      expect(url.searchParams.get('daily')).toContain('temperature_2m_max');
    });

    it('returns parsed response data for successful requests', async () => {
      const responseData = {
        timezone: 'America/Denver',
        hourly: {
          time: ['2026-06-15T00:00'],
          temperature_2m: [20],
          relative_humidity_2m: [50],
          wind_speed_10m: [10],
          wind_direction_10m: [180],
          precipitation_probability: [20],
          weather_code: [0],
          uv_index: [5],
        },
        daily: {
          time: ['2026-06-15'],
          temperature_2m_max: [25],
          temperature_2m_min: [15],
          precipitation_sum: [0],
          weather_code: [0],
          sunrise: ['2026-06-15T05:30:00'],
          sunset: ['2026-06-15T20:30:00'],
          uv_index_max: [7],
          wind_speed_10m_max: [20],
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(responseData),
      });

      const result = await fetchWeatherData(39.7, -104.9, 3);

      expect(result).toEqual(responseData);
      const [requestUrl] = fetchMock.mock.calls[0] ?? [];
      const url = new URL(requestUrl as string);
      expect(url.searchParams.get('forecast_days')).toBe('3');
    });

    it('returns null on non-OK HTTP responses', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ reason: 'server exploded' }),
      });

      await expect(fetchWeatherData(39.7, -104.9)).resolves.toBeNull();
    });

    it('returns null on network failures', async () => {
      fetchMock.mockRejectedValue(new Error('network down'));

      await expect(fetchWeatherData(39.7, -104.9)).resolves.toBeNull();
    });

    it('returns null for API-level error payloads', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ error: true, reason: 'invalid coordinates' }),
      });

      await expect(fetchWeatherData(39.7, -104.9)).resolves.toBeNull();
    });
  });
});
