/**
 * Park-related types for POTA Activation Planner
 */

/** POTA park reference (e.g., "K-0039") */
export type ParkReference = string & { readonly __brand: unique symbol };

/** Creates a validated ParkReference */
export function createParkReference(ref: string): ParkReference {
  // POTA references are like K-0039, VE-1234, etc.
  const pattern = /^[A-Z]{1,3}-\d{4,5}$/;
  if (!pattern.test(ref)) {
    throw new Error(`Invalid park reference format: ${ref}`);
  }
  return ref as ParkReference;
}

/** Maidenhead grid square (e.g., "DN44xk") */
export type GridSquare = string & { readonly __brand: unique symbol };

/** Creates a validated GridSquare */
export function createGridSquare(grid: string): GridSquare {
  // Grid squares are 4 or 6 character Maidenhead locators
  const pattern = /^[A-Z]{2}\d{2}[A-Za-z]{0,2}$/;
  if (!pattern.test(grid)) {
    throw new Error(`Invalid grid square format: ${grid}`);
  }
  return grid.toUpperCase() as GridSquare;
}

/** ISO 8601 date string */
export type ISODateString = string & { readonly __brand: unique symbol };

/** Park entity stored in the database */
export interface Park {
  /** POTA park reference (e.g., "K-0039") */
  reference: ParkReference;
  /** Park name */
  name: string;
  /** Two-letter entity/country code (e.g., "US") */
  entityId: string;
  /** Primary locator grid square */
  gridSquare: GridSquare;
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Program type (e.g., "NPS", "SP") */
  programId: string;
  /** ISO date when park was added to POTA */
  dateAdded?: ISODateString;
  /** ISO date of last activation, if any */
  lastActivation?: ISODateString;
  /** Total number of activations */
  activationCount: number;
  /** Whether this park is favorited by the user */
  isFavorite: boolean;
  /** ISO date when record was last modified */
  updatedAt: ISODateString;
  /** IANA timezone identifier (e.g., "America/Denver") computed from lat/lon */
  timezone?: string;
}

/** Search parameters for parks */
export interface ParkSearchParams {
  /** Search query (matches name or reference) */
  query?: string;
  /** Filter by entity/country code */
  entityId?: string;
  /** Filter by program type */
  programId?: string;
  /** Filter by favorite status */
  favoritesOnly?: boolean;
  /** Bounding box for geographic search */
  bounds?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/** Result from park search */
export interface ParkSearchResult {
  /** Array of matching parks */
  parks: Park[];
  /** Total number of matching records */
  total: number;
  /** Whether there are more results available */
  hasMore: boolean;
}

/** Status of CSV import operation */
export interface CsvImportStatus {
  /** Whether an import is currently in progress */
  isImporting: boolean;
  /** Number of records processed so far */
  recordsProcessed: number;
  /** Total number of records to process */
  totalRecords: number;
  /** Current phase of import */
  phase: 'idle' | 'reading' | 'parsing' | 'importing' | 'completed' | 'error';
  /** Error message if phase is 'error' */
  error?: string;
  /** Timestamp when import started */
  startedAt?: ISODateString;
  /** Timestamp when import completed */
  completedAt?: ISODateString;
}

/** Result of toggling favorite status */
export interface ToggleFavoriteResult {
  /** Park reference that was updated */
  reference: ParkReference;
  /** New favorite status */
  isFavorite: boolean;
}
