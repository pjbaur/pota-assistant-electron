/**
 * IPC Handler Registration Framework
 *
 * Provides a structured way to register IPC handlers with Zod validation
 * and error handling.
 */

import { ipcMain, BrowserWindow } from 'electron';
import type { ZodType } from 'zod';
import { IPC_CHANNELS, type IpcChannelName } from '../../shared/ipc/channels';
import type { IpcResponse, IpcErrorCode } from '../../shared/types';
import { success, error } from '../../shared/types';

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

/**
 * Register all placeholder handlers for development.
 */
export function registerPlaceholderHandlers(): void {
  const placeholderDefinitions: IpcHandlerDefinition[] = [
    // Park operations
    {
      channel: IPC_CHANNELS.PARKS_SEARCH,
      handler: createPlaceholderHandler(IPC_CHANNELS.PARKS_SEARCH),
    },
    {
      channel: IPC_CHANNELS.PARKS_GET,
      handler: createPlaceholderHandler(IPC_CHANNELS.PARKS_GET),
    },
    {
      channel: IPC_CHANNELS.PARKS_IMPORT_CSV,
      handler: createPlaceholderHandler(IPC_CHANNELS.PARKS_IMPORT_CSV),
    },
    {
      channel: IPC_CHANNELS.PARKS_GET_IMPORT_STATUS,
      handler: createPlaceholderHandler(IPC_CHANNELS.PARKS_GET_IMPORT_STATUS),
    },
    {
      channel: IPC_CHANNELS.PARKS_TOGGLE_FAVORITE,
      handler: createPlaceholderHandler(IPC_CHANNELS.PARKS_TOGGLE_FAVORITE),
    },

    // Plan operations
    {
      channel: IPC_CHANNELS.PLANS_CREATE,
      handler: createPlaceholderHandler(IPC_CHANNELS.PLANS_CREATE),
    },
    {
      channel: IPC_CHANNELS.PLANS_GET,
      handler: createPlaceholderHandler(IPC_CHANNELS.PLANS_GET),
    },
    {
      channel: IPC_CHANNELS.PLANS_LIST,
      handler: createPlaceholderHandler(IPC_CHANNELS.PLANS_LIST),
    },
    {
      channel: IPC_CHANNELS.PLANS_UPDATE,
      handler: createPlaceholderHandler(IPC_CHANNELS.PLANS_UPDATE),
    },
    {
      channel: IPC_CHANNELS.PLANS_DELETE,
      handler: createPlaceholderHandler(IPC_CHANNELS.PLANS_DELETE),
    },
    {
      channel: IPC_CHANNELS.PLANS_EXPORT,
      handler: createPlaceholderHandler(IPC_CHANNELS.PLANS_EXPORT),
    },

    // Weather
    {
      channel: IPC_CHANNELS.WEATHER_GET,
      handler: createPlaceholderHandler(IPC_CHANNELS.WEATHER_GET),
    },

    // Configuration
    {
      channel: IPC_CHANNELS.CONFIG_GET,
      handler: createPlaceholderHandler(IPC_CHANNELS.CONFIG_GET),
    },
    {
      channel: IPC_CHANNELS.CONFIG_SET,
      handler: createPlaceholderHandler(IPC_CHANNELS.CONFIG_SET),
    },

    // System
    {
      channel: IPC_CHANNELS.SYSTEM_SELECT_CSV,
      handler: createPlaceholderHandler(IPC_CHANNELS.SYSTEM_SELECT_CSV),
    },
  ];

  registerHandlers(placeholderDefinitions);
}
