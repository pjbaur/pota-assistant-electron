/**
 * CSV Import Worker
 *
 * Runs in a separate thread to parse CSV files without blocking
 * the main Electron process. Handles the CPU-intensive parsing
 * and validation, then sends parsed data back to the main thread
 * for database insertion.
 */

import { parentPort } from 'worker_threads';
import * as fs from 'fs';
import * as readline from 'readline';

// ============================================
// Types
// ============================================

/** POTA CSV row structure */
interface CsvRow {
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
interface CsvRowError {
  lineNumber: number;
  row: CsvRow;
  errors: string[];
}

/** Worker input message */
interface WorkerInput {
  type: 'parse';
  filePath: string;
  batchSize: number;
}

/** Worker output message - parsed batch */
interface WorkerBatchOutput {
  type: 'batch';
  parks: ParsedPark[];
  batchNumber: number;
  totalBatches: number;
}

/** Worker output message - progress */
interface WorkerProgressOutput {
  type: 'progress';
  phase: 'reading' | 'parsing' | 'complete';
  recordsProcessed: number;
  totalRecords: number;
  message?: string;
}

/** Worker output message - complete */
interface WorkerCompleteOutput {
  type: 'complete';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: CsvRowError[];
}

/** Worker output message - error */
interface WorkerErrorOutput {
  type: 'error';
  message: string;
}

type WorkerOutput =
  | WorkerBatchOutput
  | WorkerProgressOutput
  | WorkerCompleteOutput
  | WorkerErrorOutput;

// ============================================
// CSV Parsing Functions
// ============================================

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
    return index !== undefined && index < values.length ? (values[index] ?? '') : '';
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

  // Extract state from location description if available
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

  // Parse active status
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

// ============================================
// Worker Message Handler
// ============================================

function postMessage(message: WorkerOutput): void {
  if (parentPort !== null) {
    parentPort.postMessage(message);
  }
}

/**
 * Parse CSV file and send batches to main thread
 */
async function parseCsvFile(filePath: string, batchSize: number): Promise<void> {
  const allErrors: CsvRowError[] = [];
  const allParks: ParsedPark[] = [];
  let totalRows = 0;
  let validRows = 0;
  let invalidRows = 0;

  postMessage({
    type: 'progress',
    phase: 'reading',
    recordsProcessed: 0,
    totalRecords: 0,
    message: 'Reading CSV file...',
  });

  return new Promise((resolve, reject) => {
    let lineNumber = 0;
    let headerMap: Map<string, number> | null = null;
    let lastProgressUpdate = Date.now();

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

      totalRows++;

      // Parse the data row
      const values = parseCsvLine(line);
      const row = extractRow(values, headerMap);
      const { park, errors } = validateRow(row, lineNumber);

      if (park !== null) {
        allParks.push(park);
        validRows++;
      } else {
        allErrors.push({
          lineNumber,
          row,
          errors,
        });
        invalidRows++;
      }

      // Report progress every 500ms
      const now = Date.now();
      if (now - lastProgressUpdate > 500) {
        postMessage({
          type: 'progress',
          phase: 'parsing',
          recordsProcessed: totalRows,
          totalRecords: 0, // Unknown until complete
          message: `Parsed ${totalRows} rows...`,
        });
        lastProgressUpdate = now;
      }
    });

    rl.on('close', () => {
      // Calculate number of batches
      const totalBatches = Math.ceil(allParks.length / batchSize);

      // Send parks in batches
      for (let i = 0; i < allParks.length; i += batchSize) {
        const batch = allParks.slice(i, i + batchSize);
        postMessage({
          type: 'batch',
          parks: batch,
          batchNumber: Math.floor(i / batchSize) + 1,
          totalBatches,
        });
      }

      // Report completion
      postMessage({
        type: 'progress',
        phase: 'complete',
        recordsProcessed: totalRows,
        totalRecords: totalRows,
        message: `Parsing complete: ${validRows} valid, ${invalidRows} invalid`,
      });

      // Send final summary
      postMessage({
        type: 'complete',
        totalRows,
        validRows,
        invalidRows,
        errors: allErrors.slice(0, 100), // Limit errors to first 100
      });

      resolve();
    });

    rl.on('error', (err) => {
      postMessage({
        type: 'error',
        message: err.message,
      });
      reject(err);
    });

    fileStream.on('error', (err) => {
      postMessage({
        type: 'error',
        message: err.message,
      });
      reject(err);
    });
  });
}

// ============================================
// Worker Thread Setup
// ============================================

if (parentPort !== null) {
  parentPort.on('message', (message: WorkerInput) => {
    if (message.type === 'parse') {
      void (async () => {
        try {
          // Verify file exists
          if (!fs.existsSync(message.filePath)) {
            postMessage({
              type: 'error',
              message: `File not found: ${message.filePath}`,
            });
            return;
          }

          await parseCsvFile(message.filePath, message.batchSize ?? 500);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          postMessage({
            type: 'error',
            message: errorMessage,
          });
        }
      })();
    }
  });
}

// Export for testing
export { parseCsvLine, mapHeaders, extractRow, validateRow };
