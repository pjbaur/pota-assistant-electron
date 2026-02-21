/**
 * Shared type exports for POTA Activation Planner
 */

// Re-export all types from individual modules
export type {
  Park,
  ParkReference,
  ParkSearchParams,
  ParkSearchResult,
  GridSquare,
  ISODateString,
  CsvImportStatus,
  ToggleFavoriteResult,
} from './park';

export { createParkReference, createGridSquare } from './park';

export type {
  Plan,
  PlanId,
  PlanInput,
  PlanListParams,
  PlanListResult,
  EquipmentPreset,
  TimeSlot,
  ExportFormat,
  PlanExportResult,
} from './plan';

export { createPlanId } from './plan';

export type {
  WeatherData,
  WeatherCondition,
  HourlyForecast,
  DailyForecast,
  WeatherRequestParams,
  CachedWeather,
} from './weather';

export type {
  UserConfig,
  ConfigUpdate,
  ConfigKey,
  ThemePreference,
  DistanceUnit,
  TemperatureUnit,
} from './config';

export { DEFAULT_CONFIG } from './config';

export type {
  IpcResponse,
  IpcErrorCode,
  IpcRequestMap,
  IpcResponseMap,
  IpcChannel,
  IpcRequest,
  IpcResponseData,
  ChannelSchema,
  IpcHandler,
  IpcEventCallback,
} from './ipc';

export { success, error } from './ipc';
