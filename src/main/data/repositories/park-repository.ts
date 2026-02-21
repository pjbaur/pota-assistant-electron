/**
 * Park Repository
 *
 * Data access layer for park-related database operations.
 */

import {
  executeAll,
  executeOne,
  executeRun,
  executeScalar,
  saveDatabase,
} from '../../database/connection';
import type {
  Park,
  ParkReference,
  ParkSearchParams,
  ParkSearchResult,
  ToggleFavoriteResult,
} from '../../../shared/types/park';

/** Database row representation */
interface ParkRow {
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
}

/**
 * Convert a database row to a Park type
 */
function rowToPark(row: ParkRow): Park {
  return {
    reference: row.reference as ParkReference,
    name: row.name,
    entityId: row.country ?? String(row.entity_id ?? ''),
    gridSquare: (row.grid_square ?? '') as Park['gridSquare'],
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    programId: '', // Not stored in current schema
    activationCount: 0, // Not stored in current schema
    isFavorite: row.is_favorite === 1,
    updatedAt: new Date().toISOString() as Park['updatedAt'],
  };
}

/**
 * Search for parks based on criteria
 */
export function searchParks(params: ParkSearchParams): ParkSearchResult {
  const {
    query,
    entityId,
    favoritesOnly,
    bounds,
    limit = 100,
    offset = 0,
  } = params;

  const conditions: string[] = ['is_active = 1'];
  const sqlParams: (string | number | null)[] = [];

  // Text search on name or reference
  if (query !== undefined && query !== '') {
    conditions.push('(name LIKE ? OR reference LIKE ?)');
    const searchPattern = `%${query}%`;
    sqlParams.push(searchPattern, searchPattern);
  }

  // Filter by entity/country
  if (entityId !== undefined && entityId !== '') {
    conditions.push('country = ?');
    sqlParams.push(entityId);
  }

  // Filter by favorites
  if (favoritesOnly === true) {
    conditions.push('is_favorite = 1');
  }

  // Geographic bounds filter
  if (bounds !== undefined) {
    conditions.push(
      'latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?'
    );
    sqlParams.push(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM parks WHERE ${whereClause}`;
  const totalResult = executeScalar<number>(countSql, sqlParams);
  const total = totalResult ?? 0;

  // Get paginated results
  const dataSql = `
    SELECT * FROM parks
    WHERE ${whereClause}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `;
  sqlParams.push(limit, offset);

  const rows = executeAll<ParkRow>(dataSql, sqlParams);
  const parks = rows.map(rowToPark);

  return {
    parks,
    total,
    hasMore: offset + parks.length < total,
  };
}

/**
 * Get a single park by reference
 */
export function getParkByReference(reference: ParkReference): Park | null {
  const sql = 'SELECT * FROM parks WHERE reference = ? AND is_active = 1';
  const row = executeOne<ParkRow>(sql, [reference]);

  return row !== null ? rowToPark(row) : null;
}

/**
 * Get park by internal ID
 */
export function getParkById(id: number): Park | null {
  const sql = 'SELECT * FROM parks WHERE id = ? AND is_active = 1';
  const row = executeOne<ParkRow>(sql, [id]);

  return row !== null ? rowToPark(row) : null;
}

/**
 * Get the internal database ID for a park reference
 */
export function getParkId(reference: ParkReference): number | null {
  const sql = 'SELECT id FROM parks WHERE reference = ?';
  return executeScalar<number>(sql, [reference]);
}

/**
 * Toggle favorite status for a park
 */
export function toggleFavorite(reference: ParkReference): ToggleFavoriteResult | null {
  // Check if park exists
  const park = getParkByReference(reference);
  if (park === null) {
    return null;
  }

  // Toggle the favorite status
  const newStatus = park.isFavorite ? 0 : 1;
  const sql = 'UPDATE parks SET is_favorite = ? WHERE reference = ?';
  const rowsModified = executeRun(sql, [newStatus, reference]);

  if (rowsModified === 0) {
    return null;
  }

  saveDatabase();

  return {
    reference,
    isFavorite: newStatus === 1,
  };
}

/**
 * Insert a new park (used during CSV import)
 */
export function insertPark(park: Omit<ParkRow, 'id'>): number {
  const sql = `
    INSERT OR REPLACE INTO parks (
      reference, name, latitude, longitude, grid_square,
      state, country, entity_id, location_desc, is_active, is_favorite
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  executeRun(sql, [
    park.reference,
    park.name,
    park.latitude,
    park.longitude,
    park.grid_square,
    park.state,
    park.country,
    park.entity_id,
    park.location_desc,
    park.is_active,
    park.is_favorite,
  ]);

  // Get the last inserted ID
  const id = executeScalar<number>('SELECT last_insert_rowid()');
  return id ?? 0;
}

/**
 * Count total parks in database
 */
export function countParks(): number {
  const result = executeScalar<number>('SELECT COUNT(*) FROM parks WHERE is_active = 1');
  return result ?? 0;
}

/**
 * Clear all parks (for reimport)
 */
export function clearAllParks(): void {
  executeRun('DELETE FROM parks');
  saveDatabase();
}
