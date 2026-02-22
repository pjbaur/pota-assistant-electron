/**
 * Open-Meteo Weather API Client
 *
 * Fetches weather data from the free Open-Meteo API.
 * https://open-meteo.com/
 */

import type { WeatherCondition } from '../../shared/types/weather';

/** Open-Meteo API response structure */
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    uv_index: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    wind_speed_10m_max: number[];
  };
}

/** API error response */
interface ApiError {
  reason?: string;
  error?: boolean;
}

/** WMO weather code to condition mapping */
const WEATHER_CODE_MAP: Record<number, WeatherCondition> = {
  0: 'clear',
  1: 'clear',
  2: 'partly-cloudy',
  3: 'cloudy',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'drizzle',
  57: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'heavy-rain',
  66: 'rain',
  67: 'heavy-rain',
  71: 'snow',
  73: 'snow',
  75: 'heavy-snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'heavy-rain',
  85: 'snow',
  86: 'heavy-snow',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

/**
 * Convert WMO weather code to our condition type
 */
export function weatherCodeToCondition(code: number): WeatherCondition {
  return WEATHER_CODE_MAP[code] ?? 'clear';
}

/**
 * Fetch weather data from Open-Meteo API
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  forecastDays = 7
): Promise<OpenMeteoResponse | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');

  url.searchParams.set('latitude', latitude.toFixed(4));
  url.searchParams.set('longitude', longitude.toFixed(4));
  url.searchParams.set('hourly', [
    'temperature_2m',
    'relative_humidity_2m',
    'wind_speed_10m',
    'wind_direction_10m',
    'precipitation_probability',
    'weather_code',
    'uv_index',
  ].join(','));
  url.searchParams.set('daily', [
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'weather_code',
    'sunrise',
    'sunset',
    'uv_index_max',
    'wind_speed_10m_max',
  ].join(','));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', forecastDays.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as ApiError;
      console.error('[Weather API] Error response:', {
        status: response.status,
        reason: errorData.reason,
      });
      return null;
    }

    const data = await response.json() as OpenMeteoResponse | ApiError;

    // Check for API-level errors
    if ('error' in data && data.error) {
      console.error('[Weather API] API error:', data.reason);
      return null;
    }

    return data as OpenMeteoResponse;
  } catch (error) {
    console.error('[Weather API] Network error:', error);
    return null;
  }
}

export type { OpenMeteoResponse };
