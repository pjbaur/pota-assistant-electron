/**
 * Configuration types for POTA Activation Planner
 */

import type { EquipmentPreset } from './plan';

/** Theme preference */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Distance unit preference */
export type DistanceUnit = 'km' | 'miles';

/** Temperature unit preference */
export type TemperatureUnit = 'celsius' | 'fahrenheit';

/** User configuration */
export interface UserConfig {
  /** Operator callsign */
  callsign?: string;
  /** Home grid square */
  homeGridSquare?: string;
  /** UI theme preference */
  theme: ThemePreference;
  /** Distance unit for display */
  distanceUnit: DistanceUnit;
  /** Temperature unit for display */
  temperatureUnit: TemperatureUnit;
  /** Default map zoom level */
  defaultMapZoom: number;
  /** Show offline indicator */
  showOfflineIndicator: boolean;
  /** Auto-sync park data on startup */
  autoSyncParks: boolean;
  /** Number of days before park cache expires */
  parkCacheDays: number;
  /** Custom equipment presets */
  equipmentPresets: EquipmentPreset[];
  /** Last CSV import path */
  lastCsvPath?: string;
  /** Whether user has completed the onboarding flow */
  hasCompletedOnboarding?: boolean;
  /** Window bounds for persistence */
  windowBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
  };
}

/** Default configuration values */
export const DEFAULT_CONFIG: UserConfig = {
  theme: 'system',
  distanceUnit: 'km',
  temperatureUnit: 'celsius',
  defaultMapZoom: 8,
  showOfflineIndicator: true,
  autoSyncParks: true,
  parkCacheDays: 30,
  equipmentPresets: [],
};

/** Configuration key for type-safe access */
export type ConfigKey = keyof UserConfig;

/** Partial configuration for updates */
export type ConfigUpdate = Partial<UserConfig>;
