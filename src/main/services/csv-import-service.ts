/**
 * CSV Import Service
 *
 * Parses POTA CSV park data and validates each row.
 * Uses async chunked processing for better responsiveness.
 */

import * as fs from 'fs';
import * as readline from 'readline';

/** POTA CSV row structure */
export interface CsvRow {
  reference: string;
  name: string;
  active: string;
  entityId: string;
  locationDesc: string;
  latitude: string;
  longitude: string;
  grid: string;
}

/** Parsed park data ready for database insertion */
export interface ParsedPark {
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

/** Validation error for a specific row */
export interface CsvRowError {
  lineNumber: number;
  row: CsvRow;
  errors: string[];
}

/** Result of parsing CSV file */
export interface CsvParseResult {
  parks: ParsedPark[];
  errors: CsvRowError[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

/** Progress callback for import operations */
export type ProgressCallback = (progress: {
  phase: 'reading' | 'parsing' | 'importing' | 'completed' | 'error';
  recordsProcessed: number;
  totalRecords: number;
  message?: string;
}) => void;

/**
 * Parse a CSV line handling quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Map CSV headers to column indices
 */
function mapHeaders(headers: string[]): Map<string, number> {
  const headerMap = new Map<string, number>();
  headers.forEach((header, index) => {
    headerMap.set(header.toLowerCase().trim(), index);
  });
  return headerMap;
}

/**
 * Extract a CSV row from parsed values using header map
 */
function extractRow(values: string[], headerMap: Map<string, number>): CsvRow {
  const get = (name: string): string => {
    const index = headerMap.get(name);
    return index !== undefined && index < values.length ? values[index] ?? '' : '';
  };

  return {
    reference: get('reference'),
    name: get('name'),
    active: get('active'),
    entityId: get('entityid'),
    locationDesc: get('locationdesc'),
    latitude: get('latitude'),
    longitude: get('longitude'),
    grid: get('grid'),
  };
}

/**
 * Validate a park reference format (e.g., "K-0039", "VE-1234")
 */
function isValidParkReference(ref: string): boolean {
  return /^[A-Z]{1,3}-\d{4,5}$/i.test(ref);
}

/**
 * Validate a grid square format (e.g., "DN44xk")
 */
function isValidGridSquare(grid: string): boolean {
  return /^[A-Z]{2}\d{2}[A-Za-z]{0,2}$/.test(grid);
}

/**
 * Validate a single CSV row and return parsed park or errors
 */
function validateRow(row: CsvRow, _lineNumber: number): { park: ParsedPark | null; errors: string[] } {
  const errors: string[] = [];

  // Required field: reference
  if (row.reference === '') {
    errors.push('Missing required field: reference');
  } else if (!isValidParkReference(row.reference)) {
    errors.push(`Invalid park reference format: ${row.reference}`);
  }

  // Required field: name
  if (row.name === '') {
    errors.push('Missing required field: name');
  }

  // Validate coordinates if provided
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (row.latitude !== '') {
    latitude = parseFloat(row.latitude);
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.push(`Invalid latitude: ${row.latitude}`);
      latitude = null;
    }
  }

  if (row.longitude !== '') {
    longitude = parseFloat(row.longitude);
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.push(`Invalid longitude: ${row.longitude}`);
      longitude = null;
    }
  }

  // Validate grid square if provided
  let gridSquare: string | null = row.grid !== '' ? row.grid.toUpperCase() : null;
  if (gridSquare !== null && !isValidGridSquare(gridSquare)) {
    errors.push(`Invalid grid square format: ${row.grid}`);
    gridSquare = null;
  }

  // Parse entity ID
  let entityId: number | null = null;
  if (row.entityId !== '') {
    entityId = parseInt(row.entityId, 10);
    if (Number.isNaN(entityId)) {
      entityId = null;
    }
  }

  // If there are errors, return them
  if (errors.length > 0) {
    return { park: null, errors };
  }

  // Extract state from location description if available (e.g., "Colorado, US" -> "Colorado")
  let state: string | null = null;
  let country: string | null = row.entityId;

  if (row.locationDesc !== '') {
    const parts = row.locationDesc.split(',').map((p) => p.trim());
    if (parts.length >= 1) {
      state = parts[0] ?? null;
    }
    if (parts.length >= 2) {
      country = parts[1] ?? row.entityId;
    }
  }

  // Parse active status (1 = active, 0 = inactive)
  const isActive = row.active === '1' || row.active.toLowerCase() === 'true' ? 1 : 0;

  return {
    park: {
      reference: row.reference.toUpperCase(),
      name: row.name,
      latitude,
      longitude,
      grid_square: gridSquare,
      state,
      country,
      entity_id: entityId,
      location_desc: row.locationDesc || null,
      is_active: isActive,
      is_favorite: 0,
    },
    errors: [],
  };
}

/**
 * Parse a POTA CSV file and return validated parks
 */
export async function parseCsvFile(
  filePath: string,
  onProgress?: ProgressCallback
): Promise<CsvParseResult> {
  const result: CsvParseResult = {
    parks: [],
    errors: [],
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
  };

  return new Promise((resolve, reject) => {
    let lineNumber = 0;
    let headerMap: Map<string, number> | null = null;
    const CHUNK_SIZE = 1000;
    let pendingInChunk = 0;

    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      lineNumber++;

      // Skip empty lines
      if (line.trim() === '') {
        return;
      }

      // Parse header row
      if (headerMap === null) {
        const headers = parseCsvLine(line);
        headerMap = mapHeaders(headers);
        return;
      }

      result.totalRows++;
      pendingInChunk++;

      // Parse the data row
      const values = parseCsvLine(line);
      const row = extractRow(values, headerMap);
      const { park, errors } = validateRow(row, lineNumber);

      if (park !== null) {
        result.parks.push(park);
        result.validRows++;
      } else {
        result.errors.push({
          lineNumber,
          row,
          errors,
        });
        result.invalidRows++;
      }

      // Report progress every chunk
      if (pendingInChunk >= CHUNK_SIZE && onProgress !== undefined) {
        onProgress({
          phase: 'parsing',
          recordsProcessed: result.totalRows,
          totalRecords: 0, // Unknown until complete
          message: `Parsed ${result.totalRows} rows...`,
        });
        pendingInChunk = 0;
      }
    });

    rl.on('close', () => {
      if (onProgress !== undefined) {
        onProgress({
          phase: 'parsing',
          recordsProcessed: result.totalRows,
          totalRecords: result.totalRows,
          message: 'Parsing complete',
        });
      }
      resolve(result);
    });

    rl.on('error', (err) => {
      reject(err);
    });

    fileStream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Import parks from CSV file with progress reporting
 */
export async function importParksFromCsv(
  filePath: string,
  insertBatch: (parks: ParsedPark[]) => number,
  onProgress?: ProgressCallback
): Promise<CsvParseResult & { imported: number; skipped: number }> {
  // Report starting
  if (onProgress !== undefined) {
    onProgress({
      phase: 'reading',
      recordsProcessed: 0,
      totalRecords: 0,
      message: 'Reading CSV file...',
    });
  }

  // Parse the CSV
  const parseResult = await parseCsvFile(filePath, onProgress);

  // If no valid parks, return early
  if (parseResult.parks.length === 0) {
    if (onProgress !== undefined) {
      onProgress({
        phase: 'completed',
        recordsProcessed: 0,
        totalRecords: parseResult.totalRows,
        message: 'No valid parks to import',
      });
    }
    return {
      ...parseResult,
      imported: 0,
      skipped: parseResult.invalidRows,
    };
  }

  // Import in batches
  const BATCH_SIZE = 500;
  let imported = 0;

  if (onProgress !== undefined) {
    onProgress({
      phase: 'importing',
      recordsProcessed: 0,
      totalRecords: parseResult.parks.length,
      message: 'Importing parks to database...',
    });
  }

  for (let i = 0; i < parseResult.parks.length; i += BATCH_SIZE) {
    const batch = parseResult.parks.slice(i, i + BATCH_SIZE);
    const inserted = insertBatch(batch);
    imported += inserted;

    if (onProgress !== undefined) {
      onProgress({
        phase: 'importing',
        recordsProcessed: Math.min(i + BATCH_SIZE, parseResult.parks.length),
        totalRecords: parseResult.parks.length,
        message: `Imported ${imported} parks...`,
      });
    }

    // Yield to event loop for responsiveness
    await new Promise((resolve) => setImmediate(resolve));
  }

  if (onProgress !== undefined) {
    onProgress({
      phase: 'completed',
      recordsProcessed: imported,
      totalRecords: parseResult.parks.length,
      message: `Import complete: ${imported} parks imported`,
    });
  }

  return {
    ...parseResult,
    imported,
    skipped: parseResult.invalidRows,
  };
}
