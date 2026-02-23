/**
 * Config Repository
 *
 * Data access layer for user configuration stored as key-value pairs.
 */

import {
  executeAll,
  executeOne,
  executeRun,
  saveDatabase,
} from '../../database/connection';
import type {
  UserConfig,
  ConfigKey,
  ConfigUpdate,
} from '../../../shared/types/config';
import { DEFAULT_CONFIG } from '../../../shared/types/config';

/** Database row for config */
interface ConfigRow {
  key: string;
  value: string;
}

/**
 * Get a single config value by key
 */
export function getConfigValue<K extends ConfigKey>(
  key: K
): UserConfig[K] | undefined {
  const sql = 'SELECT value FROM user_config WHERE key = ?';
  const row = executeOne<ConfigRow>(sql, [key]);

  if (row === null) {
    return DEFAULT_CONFIG[key];
  }

  return parseConfigValue(key, row.value);
}

/**
 * Get all config values
 */
export function getAllConfig(): UserConfig {
  const sql = 'SELECT key, value FROM user_config';
  const rows = executeAll<ConfigRow>(sql);

  const config: UserConfig = { ...DEFAULT_CONFIG };

  for (const row of rows) {
    const key = row.key as ConfigKey;
    const value = parseConfigValue(key, row.value);
    if (value !== undefined) {
      (config as Record<string, unknown>)[key] = value;
    }
  }

  return config;
}

/**
 * Set a single config value
 */
export function setConfigValue<K extends ConfigKey>(
  key: K,
  value: UserConfig[K]
): void {
  const serialized = serializeConfigValue(value);
  const sql = `
    INSERT OR REPLACE INTO user_config (key, value)
    VALUES (?, ?)
  `;

  executeRun(sql, [key, serialized]);
  saveDatabase();
}

/**
 * Set multiple config values
 */
export function setConfigValues(updates: ConfigUpdate): void {
  const statements: Array<{ sql: string; params: unknown[] }> = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      statements.push({
        sql: 'INSERT OR REPLACE INTO user_config (key, value) VALUES (?, ?)',
        params: [key, serializeConfigValue(value)],
      });
    }
  }

  if (statements.length > 0) {
    for (const { sql, params } of statements) {
      executeRun(sql, params);
    }
    saveDatabase();
  }
}

/**
 * Parse a config value from its serialized form
 */
function parseConfigValue<K extends ConfigKey>(
  key: K,
  value: string
): UserConfig[K] | undefined {
  try {
    switch (key) {
      case 'theme':
        return value as UserConfig[K];

      case 'distanceUnit':
        return value as UserConfig[K];

      case 'temperatureUnit':
        return value as UserConfig[K];

      case 'defaultMapZoom':
        return (parseInt(value, 10) || DEFAULT_CONFIG.defaultMapZoom) as UserConfig[K];

      case 'showOfflineIndicator':
        return (value === 'true') as UserConfig[K];

      case 'autoSyncParks':
        return (value === 'true') as UserConfig[K];

      case 'hasCompletedOnboarding':
        return (value === 'true') as UserConfig[K];

      case 'parkCacheDays':
        return (parseInt(value, 10) || DEFAULT_CONFIG.parkCacheDays) as UserConfig[K];

      case 'callsign':
      case 'homeGridSquare':
      case 'lastCsvPath':
        return (value || undefined) as UserConfig[K];

      case 'defaultLatitude':
      case 'defaultLongitude': {
        const numValue = parseFloat(value);
        return (isNaN(numValue) ? undefined : numValue) as UserConfig[K];
      }

      case 'equipmentPresets':
        if (value === '' || value === '[]') {
          return [] as UserConfig[K];
        }
        return JSON.parse(value) as UserConfig[K];

      case 'windowBounds':
        if (value === '' || value === 'null') {
          return undefined as UserConfig[K];
        }
        return JSON.parse(value) as UserConfig[K];

      default:
        return undefined;
    }
  } catch {
    return DEFAULT_CONFIG[key];
  }
}

/**
 * Serialize a config value for storage
 */
function serializeConfigValue<K extends ConfigKey>(value: UserConfig[K]): string {
  if (value === undefined || value === null) {
    return '';
  }

  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'object':
      return JSON.stringify(value);
    default:
      return String(value);
  }
}

/**
 * Initialize config with defaults if not present
 */
export function initializeConfigDefaults(): void {
  const currentConfig = getAllConfig();

  // Set any missing defaults
  const missingDefaults: ConfigUpdate = {};

  for (const [key, defaultValue] of Object.entries(DEFAULT_CONFIG)) {
    if (currentConfig[key as ConfigKey] === undefined) {
      (missingDefaults as Record<string, unknown>)[key] = defaultValue;
    }
  }

  if (Object.keys(missingDefaults).length > 0) {
    setConfigValues(missingDefaults);
  }
}
