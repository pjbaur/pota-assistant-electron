/**
 * Preload Script
 *
 * Exposes a type-safe, validated IPC API to the renderer process.
 * All communication between renderer and main process goes through this layer.
 */

import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CHANNELS,
  IPC_EVENT_CHANNELS,
  isValidChannel,
  isValidEventChannel,
  parkSearchParamsSchema,
  parkGetParamsSchema,
  csvImportParamsSchema,
  toggleFavoriteParamsSchema,
  planInputSchema,
  planGetParamsSchema,
  planListParamsSchema,
  planUpdateParamsSchema,
  planDeleteParamsSchema,
  planExportParamsSchema,
  weatherRequestParamsSchema,
  configGetParamsSchema,
  configSetParamsSchema,
  openExternalParamsSchema,
  bandRecommendationsParamsSchema,
} from '../shared/ipc';
import type {
  IpcChannel,
  IpcRequest,
  IpcResponse,
  IpcResponseData,
} from '../shared/types';
import type { IpcEventChannelName } from '../shared/ipc/channels';

// ============================================
// Schema map for channel validation
// ============================================

/** Map of channels to their request schemas */
const requestSchemaMap = {
  [IPC_CHANNELS.PARKS_SEARCH]: parkSearchParamsSchema,
  [IPC_CHANNELS.PARKS_GET]: parkGetParamsSchema,
  [IPC_CHANNELS.PARKS_IMPORT_CSV]: csvImportParamsSchema,
  [IPC_CHANNELS.PARKS_GET_IMPORT_STATUS]: undefined,
  [IPC_CHANNELS.PARKS_TOGGLE_FAVORITE]: toggleFavoriteParamsSchema,
  [IPC_CHANNELS.PARKS_COUNT_FAVORITES]: undefined,
  [IPC_CHANNELS.PARKS_LIST_FAVORITES]: undefined,

  [IPC_CHANNELS.PLANS_CREATE]: planInputSchema,
  [IPC_CHANNELS.PLANS_GET]: planGetParamsSchema,
  [IPC_CHANNELS.PLANS_LIST]: planListParamsSchema,
  [IPC_CHANNELS.PLANS_UPDATE]: planUpdateParamsSchema,
  [IPC_CHANNELS.PLANS_DELETE]: planDeleteParamsSchema,
  [IPC_CHANNELS.PLANS_EXPORT]: planExportParamsSchema,

  [IPC_CHANNELS.WEATHER_GET]: weatherRequestParamsSchema,

  [IPC_CHANNELS.BANDS_GET_RECOMMENDATIONS]: bandRecommendationsParamsSchema,

  [IPC_CHANNELS.CONFIG_GET]: configGetParamsSchema,
  [IPC_CHANNELS.CONFIG_SET]: configSetParamsSchema,

  [IPC_CHANNELS.SYSTEM_SELECT_CSV]: undefined,
  [IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL]: openExternalParamsSchema,
} as const;

// ============================================
// Type-safe IPC API
// ============================================

/**
 * Invoke an IPC channel with type-safe parameters and validation
 */
async function invoke<C extends IpcChannel>(
  channel: C,
  params: IpcRequest<C>
): Promise<IpcResponse<IpcResponseData<C>>> {
  // Validate channel name
  if (!isValidChannel(channel)) {
    return {
      success: false,
      error: `Invalid IPC channel: ${String(channel)}`,
      errorCode: 'VALIDATION_ERROR',
    };
  }

  // Validate request parameters against schema
  const schema = requestSchemaMap[channel];
  if (schema !== undefined) {
    const result = schema.safeParse(params);
    if (!result.success) {
      return {
        success: false,
        error: `Invalid parameters: ${result.error.message}`,
        errorCode: 'VALIDATION_ERROR',
      };
    }
  }

  // Send the IPC message
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = await ipcRenderer.invoke(channel, params);
    return response as IpcResponse<IpcResponseData<C>>;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown IPC error',
      errorCode: 'INTERNAL_ERROR',
    };
  }
}

/**
 * Subscribe to IPC events from the main process
 */
function on<T = unknown>(
  channel: IpcEventChannelName,
  callback: (data: T) => void
): () => void {
  // Validate event channel name
  if (!isValidEventChannel(channel)) {
    console.error(`Invalid event channel: ${String(channel)}`);
    return () => {
      /* no-op */
    };
  }

  const handler = (_event: unknown, data: T): void => {
    callback(data);
  };

  ipcRenderer.on(channel, handler);

  // Return unsubscribe function
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

/**
 * Unsubscribe from IPC events
 */
function off(channel: IpcEventChannelName, callback?: (data: unknown) => void): void {
  if (!isValidEventChannel(channel)) {
    console.error(`Invalid event channel: ${String(channel)}`);
    return;
  }

  if (callback !== undefined) {
    ipcRenderer.removeListener(channel, callback as Parameters<typeof ipcRenderer.removeListener>[1]);
  } else {
    ipcRenderer.removeAllListeners(channel);
  }
}

// ============================================
// API Interface Definition
// ============================================

/**
 * The electronAPI interface exposed to the renderer process.
 * This provides a type-safe API for all IPC communication.
 */
export interface ElectronAPI {
  /**
   * Invoke an IPC channel with request parameters.
   * Returns a response object with success status and data or error.
   */
  invoke: typeof invoke;

  /**
   * Subscribe to IPC events from the main process.
   * Returns an unsubscribe function.
   */
  on: typeof on;

  /**
   * Unsubscribe from IPC events.
   */
  off: typeof off;

  /**
   * List of valid IPC channels (for reference/verification)
   */
  channels: typeof IPC_CHANNELS;

  /**
   * List of valid event channels
   */
  eventChannels: typeof IPC_EVENT_CHANNELS;
}

// ============================================
// Context Bridge Exposure
// ============================================

const electronAPI: ElectronAPI = {
  invoke,
  on,
  off,
  channels: IPC_CHANNELS,
  eventChannels: IPC_EVENT_CHANNELS,
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
