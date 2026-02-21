/**
 * Data Layer Exports
 *
 * Barrel file for all repositories and data access modules.
 */

// Re-export database connection utilities
export {
  initializeDatabase,
  closeDatabase,
  saveDatabase,
  getDatabase,
  isDatabaseInitialized,
  executeQuery,
  executeRun,
  executeScalar,
  executeAll,
  executeOne,
  executeTransaction,
} from '../database/connection';

// Re-export migrator
export { runMigrations, getMigrationStatus } from '../database/migrator';

// Repositories
export * as parkRepository from './repositories/park-repository';
export * as planRepository from './repositories/plan-repository';
export * as configRepository from './repositories/config-repository';
export * as weatherCacheRepository from './repositories/weather-cache-repository';
