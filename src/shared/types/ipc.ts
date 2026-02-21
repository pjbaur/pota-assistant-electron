/**
 * IPC request and response types for type-safe communication
 */

import type { ZodType } from 'zod';
import type {
  Park,
  ParkSearchParams,
  ParkSearchResult,
  CsvImportStatus,
  ToggleFavoriteResult,
} from './park';
import type {
  Plan,
  PlanInput,
  PlanListParams,
  PlanListResult,
  PlanExportResult,
  ExportFormat,
} from './plan';
import type {
  WeatherData,
  WeatherRequestParams,
} from './weather';
import type { UserConfig, ConfigUpdate, ConfigKey } from './config';

/** IPC response wrapper for handling success/error states */
export interface IpcResponse<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The response data (if success is true) */
  data?: T;
  /** Error message (if success is false) */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: IpcErrorCode;
}

/** Error codes for IPC operations */
export type IpcErrorCode =
  | 'INVALID_PARAMS'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'FILE_ERROR'
  | 'NETWORK_ERROR'
  | 'INTERNAL_ERROR'
  | 'IMPORT_IN_PROGRESS';

/** Helper to create a successful response */
export function success<T>(data: T): IpcResponse<T> {
  return { success: true, data };
}

/** Helper to create an error response */
export function error<T = never>(
  message: string,
  errorCode: IpcErrorCode = 'INTERNAL_ERROR'
): IpcResponse<T> {
  return { success: false, error: message, errorCode };
}

/** Map of channel names to their request types */
export interface IpcRequestMap {
  // Park operations
  'parks:search': ParkSearchParams;
  'parks:get': { reference: string };
  'parks:import:csv': { filePath: string };
  'parks:import:status': void;
  'parks:favorite:toggle': { reference: string };

  // Plan operations
  'plans:create': PlanInput;
  'plans:get': { id: string };
  'plans:list': PlanListParams;
  'plans:update': { id: string; updates: Partial<PlanInput> };
  'plans:delete': { id: string };
  'plans:export': { id: string; format: ExportFormat };

  // Weather
  'weather:get': WeatherRequestParams;

  // Configuration
  'config:get': { key?: ConfigKey };
  'config:set': { updates: ConfigUpdate };

  // System
  'system:select:csv': void;
  'system:open:external': { url: string };
}

/** Map of channel names to their response types */
export interface IpcResponseMap {
  // Park operations
  'parks:search': ParkSearchResult;
  'parks:get': Park | null;
  'parks:import:csv': {
    imported: number;
    skipped: number;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: Array<{ lineNumber: number; errors: string[] }>;
  };
  'parks:import:status': CsvImportStatus;
  'parks:favorite:toggle': ToggleFavoriteResult;

  // Plan operations
  'plans:create': Plan;
  'plans:get': Plan | null;
  'plans:list': PlanListResult;
  'plans:update': Plan;
  'plans:delete': { deleted: boolean };
  'plans:export': PlanExportResult;

  // Weather
  'weather:get': WeatherData | null;

  // Configuration
  'config:get': UserConfig | UserConfig[ConfigKey];
  'config:set': UserConfig;

  // System
  'system:select:csv': { canceled: boolean; filePath?: string };
  'system:open:external': { opened: boolean };
}

/** Type-safe channel names */
export type IpcChannel = keyof IpcRequestMap;

/** Extract request type for a channel */
export type IpcRequest<C extends IpcChannel> = IpcRequestMap[C];

/** Extract response type for a channel */
export type IpcResponseData<C extends IpcChannel> = IpcResponseMap[C];

/** Schema definition for a channel */
export interface ChannelSchema<C extends IpcChannel> {
  /** Channel name */
  channel: C;
  /** Zod schema for request validation */
  requestSchema: ZodType<IpcRequest<C>>;
  /** Zod schema for response validation */
  responseSchema: ZodType<IpcResponse<IpcResponseData<C>>>;
}

/** Handler function type for IPC channels */
export type IpcHandler<C extends IpcChannel> = (
  request: IpcRequest<C>
) => Promise<IpcResponse<IpcResponseData<C>>> | IpcResponse<IpcResponseData<C>>;

/** Event callback type for IPC events */
export type IpcEventCallback<T = unknown> = (data: T) => void;
