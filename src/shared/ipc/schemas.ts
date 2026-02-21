/**
 * Zod Schemas for IPC Message Validation
 *
 * All IPC messages are validated against these schemas to ensure type safety
 * and prevent malformed data from being processed.
 */

import { z } from 'zod';

// ============================================
// Park Schemas
// ============================================

/** Schema for park reference (e.g., "K-0039") */
export const parkReferenceSchema = z
  .string()
  .regex(/^[A-Z]{1,3}-\d{4,5}$/, 'Invalid park reference format');

/** Schema for grid square (e.g., "DN44xk") */
export const gridSquareSchema = z
  .string()
  .regex(/^[A-Z]{2}\d{2}[A-Za-z]{0,2}$/, 'Invalid grid square format');

/** Schema for ISO date string */
export const isoDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/, 'Invalid ISO date format');

/** Schema for bounding box in geographic search */
export const boundsSchema = z.object({
  minLat: z.number().min(-90).max(90),
  maxLat: z.number().min(-90).max(90),
  minLon: z.number().min(-180).max(180),
  maxLon: z.number().min(-180).max(180),
});

/** Schema for park search parameters */
export const parkSearchParamsSchema = z.object({
  query: z.string().optional(),
  entityId: z.string().length(2).optional(),
  programId: z.string().optional(),
  favoritesOnly: z.boolean().optional(),
  bounds: boundsSchema.optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
});

/** Schema for park get request */
export const parkGetParamsSchema = z.object({
  reference: parkReferenceSchema,
});

/** Schema for CSV import request */
export const csvImportParamsSchema = z.object({
  filePath: z.string().min(1),
});

/** Schema for toggle favorite request */
export const toggleFavoriteParamsSchema = z.object({
  reference: parkReferenceSchema,
});

// ============================================
// Plan Schemas
// ============================================

/** Schema for equipment preset */
export const equipmentPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  radio: z.string().min(1),
  antenna: z.string().min(1),
  powerWatts: z.number().positive(),
  mode: z.string().min(1),
  notes: z.string().optional(),
});

/** Schema for time slot */
export const timeSlotSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:mm)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:mm)'),
  band: z.string().min(1),
  mode: z.string().min(1),
  frequency: z.number().positive().optional(),
  notes: z.string().optional(),
});

/** Schema for plan input (create) */
export const planInputSchema = z.object({
  name: z.string().min(1).max(200),
  parkReference: parkReferenceSchema,
  activationDate: isoDateStringSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:mm)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (use HH:mm)'),
  equipmentPreset: equipmentPresetSchema.optional(),
  timeSlots: z.array(timeSlotSchema),
  operatorCallsign: z.string().optional(),
  notes: z.string().optional(),
});

/** Schema for plan ID */
export const planIdSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid plan ID format'
  );

/** Schema for plan get request */
export const planGetParamsSchema = z.object({
  id: planIdSchema,
});

/** Schema for plan list parameters */
export const planListParamsSchema = z.object({
  parkReference: parkReferenceSchema.optional(),
  dateFrom: isoDateStringSchema.optional(),
  dateTo: isoDateStringSchema.optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
});

/** Schema for plan update request */
export const planUpdateParamsSchema = z.object({
  id: planIdSchema,
  updates: planInputSchema.partial(),
});

/** Schema for plan delete request */
export const planDeleteParamsSchema = z.object({
  id: planIdSchema,
});

/** Schema for export format */
export const exportFormatSchema = z.enum(['json', 'adif', 'pdf']);

/** Schema for plan export request */
export const planExportParamsSchema = z.object({
  id: planIdSchema,
  format: exportFormatSchema,
});

// ============================================
// Weather Schemas
// ============================================

/** Schema for weather request parameters */
export const weatherRequestParamsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  hourlyCount: z.number().int().min(1).max(48).optional(),
  dailyCount: z.number().int().min(1).max(7).optional(),
  timezone: z.string().optional(),
});

// ============================================
// Config Schemas
// ============================================

/** Schema for theme preference */
export const themePreferenceSchema = z.enum(['light', 'dark', 'system']);

/** Schema for distance unit */
export const distanceUnitSchema = z.enum(['km', 'miles']);

/** Schema for temperature unit */
export const temperatureUnitSchema = z.enum(['celsius', 'fahrenheit']);

/** Schema for user config */
export const userConfigSchema = z.object({
  callsign: z.string().optional(),
  homeGridSquare: gridSquareSchema.optional(),
  theme: themePreferenceSchema,
  distanceUnit: distanceUnitSchema,
  temperatureUnit: temperatureUnitSchema,
  defaultMapZoom: z.number().int().min(1).max(20),
  showOfflineIndicator: z.boolean(),
  autoSyncParks: z.boolean(),
  parkCacheDays: z.number().int().min(1).max(365),
  equipmentPresets: z.array(equipmentPresetSchema),
  lastCsvPath: z.string().optional(),
  windowBounds: z
    .object({
      x: z.number().int(),
      y: z.number().int(),
      width: z.number().int().min(400),
      height: z.number().int().min(300),
      isMaximized: z.boolean(),
    })
    .optional(),
});

/** Schema for config get request */
export const configGetParamsSchema = z.object({
  key: z
    .enum([
      'callsign',
      'homeGridSquare',
      'theme',
      'distanceUnit',
      'temperatureUnit',
      'defaultMapZoom',
      'showOfflineIndicator',
      'autoSyncParks',
      'parkCacheDays',
      'equipmentPresets',
      'lastCsvPath',
      'windowBounds',
    ])
    .optional(),
});

/** Schema for config set request */
export const configSetParamsSchema = z.object({
  updates: userConfigSchema.partial(),
});

// ============================================
// System Schemas
// ============================================

/** Schema for open external URL request */
export const openExternalParamsSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

// ============================================
// Response Schemas
// ============================================

/** Schema for IPC error response */
export const ipcErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  errorCode: z
    .enum([
      'INVALID_PARAMS',
      'NOT_FOUND',
      'ALREADY_EXISTS',
      'VALIDATION_ERROR',
      'DATABASE_ERROR',
      'FILE_ERROR',
      'NETWORK_ERROR',
      'INTERNAL_ERROR',
      'IMPORT_IN_PROGRESS',
    ])
    .optional(),
});

/** Creates a success response schema for a given data schema */
export function successResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

/** Union of success and error response schemas */
export function ipcResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.union([successResponseSchema(dataSchema), ipcErrorSchema]);
}
