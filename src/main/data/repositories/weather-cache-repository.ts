/**
 * Weather Cache Repository
 *
 * Data access layer for cached weather data.
 * Weather data is cached with a 1-hour TTL to reduce API calls.
 */

import {
  executeOne,
  executeRun,
  saveDatabase,
} from '../../database/connection';
import type { WeatherData } from '../../../shared/types/weather';

/** Weather cache row */
interface WeatherCacheRow {
  id: number;
  latitude: number;
  longitude: number;
  data: string; // JSON
  fetched_at: string;
}

/** Cache TTL in milliseconds (1 hour) */
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Get cached weather data for a location
 */
export function getCachedWeather(
  latitude: number,
  longitude: number
): WeatherData | null {
  // Round coordinates to reduce cache fragmentation
  const roundedLat = Math.round(latitude * 100) / 100;
  const roundedLon = Math.round(longitude * 100) / 100;

  const sql = `
    SELECT * FROM weather_cache
    WHERE latitude = ? AND longitude = ?
    ORDER BY fetched_at DESC
    LIMIT 1
  `;

  const row = executeOne<WeatherCacheRow>(sql, [roundedLat, roundedLon]);

  if (row === null) {
    return null;
  }

  // Check if cache is still valid
  const fetchedAt = new Date(row.fetched_at).getTime();
  const now = Date.now();

  if (now - fetchedAt > CACHE_TTL_MS) {
    // Cache expired
    return null;
  }

  try {
    return JSON.parse(row.data) as WeatherData;
  } catch {
    return null;
  }
}

/**
 * Store weather data in cache
 */
export function setCachedWeather(
  latitude: number,
  longitude: number,
  data: WeatherData
): void {
  // Round coordinates to reduce cache fragmentation
  const roundedLat = Math.round(latitude * 100) / 100;
  const roundedLon = Math.round(longitude * 100) / 100;

  const sql = `
    INSERT OR REPLACE INTO weather_cache (latitude, longitude, data, fetched_at)
    VALUES (?, ?, ?, ?)
  `;

  executeRun(sql, [
    roundedLat,
    roundedLon,
    JSON.stringify(data),
    new Date().toISOString(),
  ]);

  saveDatabase();
}

/**
 * Clear expired weather cache entries
 */
export function clearExpiredWeatherCache(): number {
  const cutoffTime = new Date(Date.now() - CACHE_TTL_MS).toISOString();

  const sql = 'DELETE FROM weather_cache WHERE fetched_at < ?';
  const rowsModified = executeRun(sql, [cutoffTime]);

  if (rowsModified > 0) {
    saveDatabase();
  }

  return rowsModified;
}

/**
 * Clear all weather cache
 */
export function clearAllWeatherCache(): void {
  executeRun('DELETE FROM weather_cache');
  saveDatabase();
}
