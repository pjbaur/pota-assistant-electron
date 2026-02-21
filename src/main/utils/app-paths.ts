/**
 * Platform-specific application paths utility
 * Provides consistent access to app data directories across platforms
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface AppPaths {
  /** User data directory for app configuration and databases */
  userData: string;
  /** Directory for log files */
  logs: string;
  /** Directory for cached data (can be cleared) */
  cache: string;
  /** Directory for temporary files */
  temp: string;
  /** Directory for downloaded files */
  downloads: string;
  /** Directory for exported plans and reports */
  exports: string;
}

/**
 * Get platform-specific application paths
 * Creates directories if they don't exist
 */
export function getAppPaths(): AppPaths {
  const userData = app.getPath('userData');
  const logs = path.join(userData, 'logs');
  const cache = path.join(userData, 'cache');
  const temp = path.join(userData, 'temp');
  const downloads = app.getPath('downloads');
  const exports = path.join(userData, 'exports');

  // Ensure directories exist
  const directories = [logs, cache, temp, exports];
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  return {
    userData,
    logs,
    cache,
    temp,
    downloads,
    exports,
  };
}

/**
 * Get the database file path
 */
export function getDatabasePath(): string {
  const paths = getAppPaths();
  return path.join(paths.userData, 'pota-planner.db');
}

/**
 * Get the path for a specific named file in the user data directory
 */
export function getUserDataFile(filename: string): string {
  const paths = getAppPaths();
  return path.join(paths.userData, filename);
}

/**
 * Get the path for a cache file
 */
export function getCacheFile(filename: string): string {
  const paths = getAppPaths();
  return path.join(paths.cache, filename);
}

/**
 * Clear the cache directory
 */
export function clearCache(): void {
  const paths = getAppPaths();
  if (fs.existsSync(paths.cache)) {
    const files = fs.readdirSync(paths.cache);
    for (const file of files) {
      const filePath = path.join(paths.cache, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  }
}
