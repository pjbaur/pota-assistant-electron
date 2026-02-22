/**
 * IPC Channel Constants
 *
 * All IPC channel names are defined here as constants to ensure type safety
 * and prevent typos in channel names throughout the codebase.
 */

export const IPC_CHANNELS = {
  // Park operations
  PARKS_SEARCH: 'parks:search',
  PARKS_GET: 'parks:get',
  PARKS_IMPORT_CSV: 'parks:import:csv',
  PARKS_GET_IMPORT_STATUS: 'parks:import:status',
  PARKS_TOGGLE_FAVORITE: 'parks:favorite:toggle',

  // Plan operations
  PLANS_CREATE: 'plans:create',
  PLANS_GET: 'plans:get',
  PLANS_LIST: 'plans:list',
  PLANS_UPDATE: 'plans:update',
  PLANS_DELETE: 'plans:delete',
  PLANS_EXPORT: 'plans:export',

  // Weather
  WEATHER_GET: 'weather:get',

  // Band recommendations
  BANDS_GET_RECOMMENDATIONS: 'bands:get:recommendations',

  // Configuration
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',

  // System
  SYSTEM_SELECT_CSV: 'system:select:csv',
  SYSTEM_OPEN_EXTERNAL: 'system:open:external',
} as const;

/** Type for valid channel names */
export type IpcChannelName = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/** Array of all valid channel names for validation */
export const VALID_CHANNELS: readonly IpcChannelName[] = Object.values(IPC_CHANNELS);

/** Check if a channel name is valid */
export function isValidChannel(channel: string): channel is IpcChannelName {
  return VALID_CHANNELS.includes(channel as IpcChannelName);
}

/** Event channels (for main -> renderer communication) */
export const IPC_EVENT_CHANNELS = {
  /** CSV import progress updates */
  PARKS_IMPORT_PROGRESS: 'event:parks:import:progress',
  /** Park data sync complete */
  PARKS_SYNC_COMPLETE: 'event:parks:sync:complete',
  /** Configuration changed */
  CONFIG_CHANGED: 'event:config:changed',
} as const;

/** Type for valid event channel names */
export type IpcEventChannelName =
  (typeof IPC_EVENT_CHANNELS)[keyof typeof IPC_EVENT_CHANNELS];

/** Array of all valid event channel names */
export const VALID_EVENT_CHANNELS: readonly IpcEventChannelName[] =
  Object.values(IPC_EVENT_CHANNELS);

/** Check if an event channel name is valid */
export function isValidEventChannel(
  channel: string
): channel is IpcEventChannelName {
  return VALID_EVENT_CHANNELS.includes(channel as IpcEventChannelName);
}
