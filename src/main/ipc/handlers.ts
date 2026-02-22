/**
 * IPC Handler Registration Framework
 *
 * Provides a structured way to register IPC handlers with Zod validation
 * and error handling.
 */

import { ipcMain, BrowserWindow, dialog, shell } from 'electron';
import type { ZodType } from 'zod';
import { IPC_CHANNELS, IPC_EVENT_CHANNELS, type IpcChannelName } from '../../shared/ipc/channels';
import type { IpcResponse, IpcErrorCode } from '../../shared/types';
import { success, error } from '../../shared/types';
import * as parkRepo from '../data/repositories/park-repository';
import * as planRepo from '../data/repositories/plan-repository';
import * as configRepo from '../data/repositories/config-repository';
import * as csvImportService from '../services/csv-import-service';
import * as bandService from '../services/band-service';
import { recordImportMetadata } from '../database/connection';
import type { ParkSearchParams, CsvImportStatus } from '../../shared/types/park';
import type { PlanInput, PlanListParams } from '../../shared/types/plan';
import type { ConfigUpdate } from '../../shared/types/config';

// ============================================
// Handler Types
// ============================================

/**
 * Generic handler function type for an IPC channel.
 * Uses unknown for params to allow flexible typing at registration.
 */
export type IpcHandlerFn = (
  params: unknown
) => Promise<IpcResponse<unknown>> | IpcResponse<unknown>;

/**
 * Handler definition with optional schema validation.
 */
export interface IpcHandlerDefinition {
  /** The channel to handle */
  channel: IpcChannelName;
  /** Optional Zod schema for request validation */
  requestSchema?: ZodType;
  /** The handler function */
  handler: IpcHandlerFn;
}

// ============================================
// Handler Registry
// ============================================

/** Map of registered handlers */
const handlers = new Map<IpcChannelName, IpcHandlerDefinition>();

/**
 * Register an IPC handler with optional request validation.
 */
export function registerHandler(definition: IpcHandlerDefinition): void {
  const { channel, requestSchema, handler } = definition;

  // Check for duplicate registration
  if (handlers.has(channel)) {
    console.warn(`IPC handler already registered for channel: ${channel}`);
    return;
  }

  // Store the handler definition
  handlers.set(channel, definition);

  // Register with electron
  ipcMain.handle(channel, async (_event, params: unknown) => {
    try {
      // Validate request if schema is provided
      if (requestSchema !== undefined) {
        const result = requestSchema.safeParse(params);
        if (!result.success) {
          return error(
            `Invalid request parameters: ${result.error.message}`,
            'VALIDATION_ERROR'
          );
        }
        params = result.data;
      }

      // Call the handler
      const response = await handler(params);
      return response;
    } catch (err) {
      // Handle unexpected errors
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      console.error(`IPC handler error for ${channel}:`, err);
      return error(
        `Handler error: ${errorMessage}`,
        'INTERNAL_ERROR'
      );
    }
  });
}

/**
 * Register multiple handlers at once.
 */
export function registerHandlers(definitions: IpcHandlerDefinition[]): void {
  for (const definition of definitions) {
    registerHandler(definition);
  }
}

/**
 * Unregister an IPC handler.
 */
export function unregisterHandler(channel: IpcChannelName): void {
  handlers.delete(channel);
  ipcMain.removeHandler(channel);
}

/**
 * Unregister all handlers.
 */
export function unregisterAllHandlers(): void {
  const channels = Array.from(handlers.keys());
  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }
  handlers.clear();
}

// ============================================
// Event Broadcasting
// ============================================

/**
 * Send an event to all renderer windows.
 */
export function broadcastEvent<T>(
  channel: IpcChannelName,
  data: T
): void {
  const windows = BrowserWindow.getAllWindows();

  for (const window of windows) {
    window.webContents.send(channel, data);
  }
}

/**
 * Send an event to a specific window.
 */
export function sendEvent<T>(
  windowId: number,
  channel: IpcChannelName,
  data: T
): void {
  const window = BrowserWindow.fromId(windowId);

  if (window !== null && !window.isDestroyed()) {
    window.webContents.send(channel, data);
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create a validated error response.
 */
export function createError<T = never>(
  message: string,
  errorCode: IpcErrorCode = 'INTERNAL_ERROR'
): IpcResponse<T> {
  return error(message, errorCode);
}

/**
 * Create a validated success response.
 */
export function createSuccess<T>(data: T): IpcResponse<T> {
  return success(data);
}

/**
 * Check if a value is a valid IPC response.
 */
export function isIpcResponse<T>(value: unknown): value is IpcResponse<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const response = value as Record<string, unknown>;
  return (
    typeof response['success'] === 'boolean' &&
    (response['success'] === true
      ? 'data' in response
      : typeof response['error'] === 'string')
  );
}

// ============================================
// Placeholder Handlers
// ============================================

/**
 * Create a placeholder handler that returns "not implemented" error.
 * Useful during development when actual handlers aren't ready.
 */
export function createPlaceholderHandler(channel: IpcChannelName): IpcHandlerFn {
  return (): IpcResponse<unknown> => {
    return error(`Handler not implemented for channel: ${channel}`, 'INTERNAL_ERROR');
  };
}

// ============================================
// Park Handlers
// ============================================

/**
 * Handler for park search
 */
const parkSearchHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const searchParams = params as ParkSearchParams;
  const result = parkRepo.searchParks(searchParams);
  return success(result);
};

/**
 * Handler for getting a single park
 */
const parkGetHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const { reference } = params as { reference: string };
  const park = parkRepo.getParkByReference(reference);

  if (park === null) {
    return error('Park not found', 'NOT_FOUND');
  }

  return success(park);
};

/**
 * Handler for toggling park favorite status
 */
const parkToggleFavoriteHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const { reference } = params as { reference: string };
  const result = parkRepo.toggleFavorite(reference);

  if (result === null) {
    return error('Park not found', 'NOT_FOUND');
  }

  return success(result);
};

// ============================================
// Plan Handlers
// ============================================

/**
 * Handler for creating a plan
 */
const planCreateHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const input = params as PlanInput;
  const plan = planRepo.createPlan(input);

  if (plan === null) {
    return error('Park not found for the given reference', 'NOT_FOUND');
  }

  return success(plan);
};

/**
 * Handler for getting a plan by ID
 */
const planGetHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const { id } = params as { id: string };
  const plan = planRepo.getPlanById(id);

  if (plan === null) {
    return error('Plan not found', 'NOT_FOUND');
  }

  return success(plan);
};

/**
 * Handler for listing plans
 */
const planListHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const listParams = params as PlanListParams;
  const result = planRepo.listPlans(listParams);
  return success(result);
};

/**
 * Handler for updating a plan
 */
const planUpdateHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const { id, updates } = params as { id: string; updates: Partial<PlanInput> };
  const plan = planRepo.updatePlan(id, updates);

  if (plan === null) {
    return error('Plan not found', 'NOT_FOUND');
  }

  return success(plan);
};

/**
 * Handler for deleting a plan
 */
const planDeleteHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const { id } = params as { id: string };
  const deleted = planRepo.deletePlan(id);

  if (!deleted) {
    return error('Plan not found', 'NOT_FOUND');
  }

  return success({ deleted: true });
};

/**
 * Handler for exporting a plan
 */
const planExportHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const { id, format } = params as { id: string; format: string };
  const plan = planRepo.getPlanById(id);

  if (plan === null) {
    return error('Plan not found', 'NOT_FOUND');
  }

  // Generate export content based on format
  let content: string;
  let filename: string;

  switch (format) {
    case 'json':
      content = JSON.stringify(plan, null, 2);
      filename = `activation-plan-${plan.id}.json`;
      break;
    case 'adif':
      // ADIF format would be more complex in real implementation
      content = `<ADIF_VER:5>3.1.0\n<EOH>\n<PARK_REF:${plan.parkReference.length}>${plan.parkReference}\n`;
      filename = `activation-plan-${plan.id}.adi`;
      break;
    case 'pdf':
      // PDF generation would require additional libraries
      return error('PDF export not yet implemented', 'INTERNAL_ERROR');
    default:
      return error(`Unsupported export format: ${format}`, 'VALIDATION_ERROR');
  }

  return success({
    content,
    format,
    filename,
  });
};

// ============================================
// Config Handlers
// ============================================

/**
 * Handler for getting config
 */
const configGetHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const { key } = params as { key?: string };

  if (key !== undefined) {
    const value = configRepo.getConfigValue(key);
    return success({ [key]: value });
  }

  const config = configRepo.getAllConfig();
  return success(config);
};

/**
 * Handler for setting config
 */
const configSetHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const { updates } = params as { updates: ConfigUpdate };
  configRepo.setConfigValues(updates);

  // Broadcast config change to all windows
  broadcastEvent('event:config:changed', updates);

  return success({ updated: true });
};

// ============================================
// System Handlers
// ============================================

/**
 * Handler for CSV file selection dialog
 */
const systemSelectCsvHandler: IpcHandlerFn = async (): Promise<IpcResponse<unknown>> => {
  const result = await dialog.showOpenDialog({
    title: 'Select POTA Parks CSV File',
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return success({ canceled: true, filePath: null });
  }

  return success({ canceled: false, filePath: result.filePaths[0] });
};

/**
 * Handler for opening external URLs
 */
const systemOpenExternalHandler: IpcHandlerFn = async (params): Promise<IpcResponse<unknown>> => {
  const { url } = params as { url: string };

  try {
    await shell.openExternal(url);
    return success({ opened: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return error(`Failed to open URL: ${errorMessage}`, 'INTERNAL_ERROR');
  }
};

// ============================================
// Weather Handler
// ============================================

import * as weatherService from '../services/weather-service';
import type { WeatherRequestParams } from '../../shared/types/weather';

/**
 * Handler for weather requests
 */
const weatherGetHandler: IpcHandlerFn = async (params): Promise<IpcResponse<unknown>> => {
  const { latitude, longitude } = params as { latitude: number; longitude: number };

  // Validate coordinates
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return error('Invalid coordinates provided', 'VALIDATION_ERROR');
  }

  // Validate coordinate ranges
  if (latitude < -90 || latitude > 90) {
    return error('Latitude must be between -90 and 90', 'VALIDATION_ERROR');
  }

  if (longitude < -180 || longitude > 180) {
    return error('Longitude must be between -180 and 180', 'VALIDATION_ERROR');
  }

  const requestParams: WeatherRequestParams = {
    latitude,
    longitude,
    hourlyCount: 48,
    dailyCount: 7,
  };

  const weatherData = await weatherService.getWeather(requestParams);

  if (weatherData === null) {
    return error('Failed to fetch weather data', 'INTERNAL_ERROR');
  }

  return success(weatherData);
};

// ============================================
// Band Recommendations Handler
// ============================================

/**
 * Handler for band recommendations
 */
const bandsGetRecommendationsHandler: IpcHandlerFn = (params): IpcResponse<unknown> => {
  const { date } = params as { date: string };

  // Parse the date
  const parsedDate = new Date(date);

  // Validate the date
  if (Number.isNaN(parsedDate.getTime())) {
    return error('Invalid date format provided', 'VALIDATION_ERROR');
  }

  const forecast = bandService.getBandRecommendations(parsedDate);
  return success(forecast);
};

// ============================================
// CSV Import State
// ============================================

/** Current import status state */
let currentImportStatus: CsvImportStatus = {
  isImporting: false,
  recordsProcessed: 0,
  totalRecords: 0,
  phase: 'idle',
};

/**
 * Broadcast import progress to all windows
 */
function broadcastImportProgress(progress: csvImportService.ProgressCallback extends (p: infer P) => void ? P : never): void {
  currentImportStatus = {
    isImporting: progress.phase !== 'completed' && progress.phase !== 'error',
    recordsProcessed: progress.recordsProcessed,
    totalRecords: progress.totalRecords,
    phase: progress.phase,
    error: progress.phase === 'error' ? progress.message : undefined,
  };

  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    window.webContents.send(IPC_EVENT_CHANNELS.PARKS_IMPORT_PROGRESS, currentImportStatus);
  }
}

// ============================================
// CSV Import Handlers
// ============================================

/**
 * Handler for CSV import
 */
const csvImportHandler: IpcHandlerFn = async (params): Promise<IpcResponse<unknown>> => {
  const { filePath } = params as { filePath: string };

  // Check if import is already in progress
  if (currentImportStatus.isImporting) {
    return error('An import is already in progress', 'IMPORT_IN_PROGRESS');
  }

  // Reset status
  currentImportStatus = {
    isImporting: true,
    recordsProcessed: 0,
    totalRecords: 0,
    phase: 'reading',
    startedAt: new Date().toISOString(),
  };

  try {
    // Create batch insert function
    const insertBatch = (parks: csvImportService.ParsedPark[]): number => {
      let inserted = 0;
      for (const park of parks) {
        parkRepo.insertPark({
          reference: park.reference,
          name: park.name,
          latitude: park.latitude,
          longitude: park.longitude,
          grid_square: park.grid_square,
          state: park.state,
          country: park.country,
          entity_id: park.entity_id,
          location_desc: park.location_desc,
          is_active: park.is_active,
          is_favorite: park.is_favorite,
        });
        inserted++;
      }
      return inserted;
    };

    // Run import with progress reporting
    const result = await csvImportService.importParksFromCsv(
      filePath,
      insertBatch,
      broadcastImportProgress
    );

    console.log('[CSV Import] Result:', JSON.stringify(result, null, 2));

    // Record import metadata
    const filename = filePath.split(/[/\\]/).pop() ?? filePath;
    recordImportMetadata(filename, result.imported);

    // Update completed status
    currentImportStatus = {
      isImporting: false,
      recordsProcessed: result.imported,
      totalRecords: result.validRows,
      phase: 'completed',
      completedAt: new Date().toISOString(),
    };

    return success({
      imported: result.imported,
      skipped: result.skipped,
      totalRows: result.totalRows,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      errors: Array.isArray(result.errors) ? result.errors.slice(0, 100).map((e) => ({
        lineNumber: e.lineNumber,
        errors: e.errors,
      })) : [],
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    currentImportStatus = {
      isImporting: false,
      recordsProcessed: 0,
      totalRecords: 0,
      phase: 'error',
      error: errorMessage,
    };

    broadcastImportProgress({
      phase: 'error',
      recordsProcessed: 0,
      totalRecords: 0,
      message: errorMessage,
    });

    return error(`Import failed: ${errorMessage}`, 'FILE_ERROR');
  }
};

/**
 * Handler for CSV import status
 */
const csvImportStatusHandler: IpcHandlerFn = (): IpcResponse<unknown> => {
  return success(currentImportStatus);
};

// ============================================
// Register All Handlers
// ============================================

/**
 * Register all IPC handlers for the application.
 * Replaces placeholder handlers with real implementations.
 */
export function registerAppHandlers(): void {
  const handlerDefinitions: IpcHandlerDefinition[] = [
    // Park operations
    {
      channel: IPC_CHANNELS.PARKS_SEARCH,
      handler: parkSearchHandler,
    },
    {
      channel: IPC_CHANNELS.PARKS_GET,
      handler: parkGetHandler,
    },
    {
      channel: IPC_CHANNELS.PARKS_IMPORT_CSV,
      handler: csvImportHandler,
    },
    {
      channel: IPC_CHANNELS.PARKS_GET_IMPORT_STATUS,
      handler: csvImportStatusHandler,
    },
    {
      channel: IPC_CHANNELS.PARKS_TOGGLE_FAVORITE,
      handler: parkToggleFavoriteHandler,
    },

    // Plan operations
    {
      channel: IPC_CHANNELS.PLANS_CREATE,
      handler: planCreateHandler,
    },
    {
      channel: IPC_CHANNELS.PLANS_GET,
      handler: planGetHandler,
    },
    {
      channel: IPC_CHANNELS.PLANS_LIST,
      handler: planListHandler,
    },
    {
      channel: IPC_CHANNELS.PLANS_UPDATE,
      handler: planUpdateHandler,
    },
    {
      channel: IPC_CHANNELS.PLANS_DELETE,
      handler: planDeleteHandler,
    },
    {
      channel: IPC_CHANNELS.PLANS_EXPORT,
      handler: planExportHandler,
    },

    // Weather
    {
      channel: IPC_CHANNELS.WEATHER_GET,
      handler: weatherGetHandler,
    },

    // Band recommendations
    {
      channel: IPC_CHANNELS.BANDS_GET_RECOMMENDATIONS,
      handler: bandsGetRecommendationsHandler,
    },

    // Configuration
    {
      channel: IPC_CHANNELS.CONFIG_GET,
      handler: configGetHandler,
    },
    {
      channel: IPC_CHANNELS.CONFIG_SET,
      handler: configSetHandler,
    },

    // System
    {
      channel: IPC_CHANNELS.SYSTEM_SELECT_CSV,
      handler: systemSelectCsvHandler,
    },
    {
      channel: IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL,
      handler: systemOpenExternalHandler,
    },
  ];

  registerHandlers(handlerDefinitions);
}

/**
 * @deprecated Use registerAppHandlers() instead.
 * Register all placeholder handlers for development.
 */
export function registerPlaceholderHandlers(): void {
  registerAppHandlers();
}
