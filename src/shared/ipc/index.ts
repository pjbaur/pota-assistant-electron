/**
 * IPC Communication Layer Exports
 */

export { IPC_CHANNELS, IPC_EVENT_CHANNELS, VALID_CHANNELS, VALID_EVENT_CHANNELS, isValidChannel, isValidEventChannel } from './channels';
export type { IpcChannelName, IpcEventChannelName } from './channels';

// Export all schemas
export {
  // Park schemas
  parkReferenceSchema,
  gridSquareSchema,
  isoDateStringSchema,
  boundsSchema,
  parkSearchParamsSchema,
  parkGetParamsSchema,
  csvImportParamsSchema,
  toggleFavoriteParamsSchema,

  // Plan schemas
  equipmentPresetSchema,
  timeSlotSchema,
  planInputSchema,
  planIdSchema,
  planGetParamsSchema,
  planListParamsSchema,
  planUpdateParamsSchema,
  planDeleteParamsSchema,
  exportFormatSchema,
  planExportParamsSchema,

  // Weather schemas
  weatherRequestParamsSchema,

  // Config schemas
  themePreferenceSchema,
  distanceUnitSchema,
  temperatureUnitSchema,
  userConfigSchema,
  configGetParamsSchema,
  configSetParamsSchema,

  // System schemas
  openExternalParamsSchema,

  // Band recommendations schemas
  bandRecommendationsParamsSchema,

  // Response schemas
  ipcErrorSchema,
  successResponseSchema,
  ipcResponseSchema,
} from './schemas';
