import {
  DEFAULT_CONFIG,
  createGridSquare,
  createParkReference,
  createPlanId,
} from '@shared/types';
import type {
  BandCondition,
  BandId,
  BandRecommendation,
  DailyForecast,
  DayBandForecast,
  DistanceUnit,
  EquipmentPreset,
  HourlyBandCondition,
  HourlyForecast,
  ISODateString,
  Park,
  Plan,
  PlanInput,
  PlanStatus,
  TemperatureUnit,
  ThemePreference,
  TimeSlot,
  UserConfig,
  WeatherCondition,
  WeatherData,
} from '@shared/types';

function asIsoDateString(value: string): ISODateString {
  return value as ISODateString;
}

export const PLAN_STATUS_VALUES: PlanStatus[] = ['draft', 'finalized', 'completed', 'cancelled'];
export const BAND_ID_VALUES: BandId[] = ['80m', '60m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m', '2m'];
export const MODE_OPTIONS = ['SSB', 'CW', 'FT8'] as const;
export type ModeOption = (typeof MODE_OPTIONS)[number];
export const BAND_CONDITION_VALUES: BandCondition[] = ['excellent', 'good', 'fair', 'poor'];
export const WEATHER_CONDITION_VALUES: WeatherCondition[] = [
  'clear',
  'partly-cloudy',
  'cloudy',
  'fog',
  'drizzle',
  'rain',
  'heavy-rain',
  'snow',
  'heavy-snow',
  'thunderstorm',
];
export const THEME_VALUES: ThemePreference[] = ['light', 'dark', 'system'];
export const DISTANCE_UNIT_VALUES: DistanceUnit[] = ['km', 'miles'];
export const TEMPERATURE_UNIT_VALUES: TemperatureUnit[] = ['celsius', 'fahrenheit'];
export const DEFAULT_PLAN_STATUS_FIXTURE = {
  status: PLAN_STATUS_VALUES[0],
} as const;
export const DEFAULT_BAND_ID_FIXTURE = {
  bandId: BAND_ID_VALUES[4],
} as const;
export const DEFAULT_MODE_FIXTURE = {
  mode: MODE_OPTIONS[2],
} as const;
export const DEFAULT_BAND_CONDITION_FIXTURE = {
  condition: BAND_CONDITION_VALUES[1],
} as const;
export const DEFAULT_WEATHER_CONDITION_FIXTURE = {
  condition: WEATHER_CONDITION_VALUES[0],
} as const;
export const DEFAULT_THEME_FIXTURE = {
  theme: THEME_VALUES[2],
} as const;
export const DEFAULT_DISTANCE_UNIT_FIXTURE = {
  distanceUnit: DISTANCE_UNIT_VALUES[0],
} as const;
export const DEFAULT_TEMPERATURE_UNIT_FIXTURE = {
  temperatureUnit: TEMPERATURE_UNIT_VALUES[0],
} as const;

export const DEFAULT_BAND_RECOMMENDATION: BandRecommendation = {
  band: '20m',
  condition: 'good',
  timeSlots: ['06:00-08:00', '17:00-20:00'],
  reason: 'Expected stable daytime propagation for 20m.',
};

export const DEFAULT_HOURLY_BAND_CONDITION: HourlyBandCondition = {
  hour: 6,
  bestBands: ['20m', '40m'],
  conditions: {
    '20m': 'good',
    '40m': 'fair',
  },
};

export const DEFAULT_DAY_BAND_FORECAST: DayBandForecast = {
  date: '2026-02-24',
  recommendations: [DEFAULT_BAND_RECOMMENDATION],
  hourByHour: [DEFAULT_HOURLY_BAND_CONDITION],
};

export function createPark(overrides: Partial<Park> = {}): Park {
  const defaults: Park = {
    reference: createParkReference('K-0039'),
    name: 'Yellowstone National Park',
    entityId: 'US',
    gridSquare: createGridSquare('DN44'),
    latitude: 44.428,
    longitude: -110.5885,
    programId: 'NPS',
    activationCount: 42,
    isFavorite: false,
    updatedAt: asIsoDateString('2026-01-01T00:00:00Z'),
    timezone: 'America/Denver',
  };

  return { ...defaults, ...overrides };
}

export function createEquipmentPreset(overrides: Partial<EquipmentPreset> = {}): EquipmentPreset {
  const defaults: EquipmentPreset = {
    id: 'preset-qrp',
    name: 'QRP Portable',
    radio: 'FT-818',
    antenna: 'End-fed halfwave',
    powerWatts: 5,
    mode: 'SSB',
    notes: 'Lightweight portable station',
  };

  return { ...defaults, ...overrides };
}

export function createTimeSlot(overrides: Partial<TimeSlot> = {}): TimeSlot {
  const defaults: TimeSlot = {
    startTime: '08:00',
    endTime: '10:00',
    band: '20m',
    mode: 'SSB',
    frequency: 14.285,
    notes: 'Morning run',
  };

  return { ...defaults, ...overrides };
}

export function createPlanInput(overrides: Partial<PlanInput> = {}): PlanInput {
  const defaults: PlanInput = {
    name: 'Weekend Activation',
    parkReference: createPark().reference,
    activationDate: asIsoDateString('2026-03-15'),
    startTime: '08:00',
    endTime: '12:00',
    equipmentPreset: createEquipmentPreset(),
    bands: ['20m', '40m'],
    timeSlots: [createTimeSlot()],
    operatorCallsign: 'K1ABC',
    notes: 'Bring backup battery',
  };

  return { ...defaults, ...overrides };
}

export function createPlan(overrides: Partial<Plan> = {}): Plan {
  const input = createPlanInput();
  const defaults: Plan = {
    ...input,
    id: createPlanId('550e8400-e29b-41d4-a716-446655440000'),
    status: 'draft',
    createdAt: asIsoDateString('2026-01-01T00:00:00Z'),
    updatedAt: asIsoDateString('2026-01-02T00:00:00Z'),
  };

  return { ...defaults, ...overrides };
}

export function createHourlyForecast(
  overrides: Partial<HourlyForecast> = {}
): HourlyForecast {
  const defaults: HourlyForecast = {
    time: asIsoDateString('2026-03-15T08:00:00Z'),
    temperatureC: 11,
    temperatureF: 51.8,
    humidity: 48,
    windSpeedKmh: 14,
    windDirection: 240,
    windGustKmh: 21,
    precipitationProbability: 10,
    precipitationMm: 0,
    condition: 'clear',
    uvIndex: 2,
    visibilityKm: 10,
  };

  return { ...defaults, ...overrides };
}

export function createDailyForecast(overrides: Partial<DailyForecast> = {}): DailyForecast {
  const defaults: DailyForecast = {
    date: asIsoDateString('2026-03-15'),
    tempMaxC: 17,
    tempMaxF: 62.6,
    tempMinC: 6,
    tempMinF: 42.8,
    precipitationMm: 0.2,
    precipitationProbabilityMax: 20,
    condition: 'partly-cloudy',
    sunrise: '06:43',
    sunset: '19:12',
    uvIndexMax: 6,
    windSpeedMaxKmh: 24,
    windDirectionDominant: 260,
  };

  return { ...defaults, ...overrides };
}

export function createWeatherData(overrides: Partial<WeatherData> = {}): WeatherData {
  const defaults: WeatherData = {
    latitude: 44.428,
    longitude: -110.5885,
    fetchedAt: asIsoDateString('2026-03-15T07:30:00Z'),
    source: 'Open-Meteo',
    timezone: 'America/Denver',
    hourly: [createHourlyForecast()],
    daily: [createDailyForecast()],
  };

  return { ...defaults, ...overrides };
}

export function createUserConfig(overrides: Partial<UserConfig> = {}): UserConfig {
  const defaults: UserConfig = {
    ...DEFAULT_CONFIG,
    callsign: 'K1ABC',
    homeGridSquare: 'FN31',
    defaultLatitude: 41.3083,
    defaultLongitude: -72.9279,
    equipmentPresets: [createEquipmentPreset()],
    hasCompletedOnboarding: true,
  };

  return { ...defaults, ...overrides };
}

export function createDayBandForecast(
  overrides: Partial<DayBandForecast> = {}
): DayBandForecast {
  const defaults: DayBandForecast = {
    date: '2026-03-15',
    recommendations: [{ ...DEFAULT_BAND_RECOMMENDATION }],
    hourByHour: [{ ...DEFAULT_HOURLY_BAND_CONDITION }],
  };

  return { ...defaults, ...overrides };
}

function escapeCsv(value: string): string {
  const needsQuotes =
    value.includes(',') || value.includes('"') || value.includes('\n');
  if (!needsQuotes) {
    return value;
  }
  return `"${value.replaceAll('"', '""')}"`;
}

export function createCsvRow(overrides: Partial<Record<string, string>> = {}): string {
  const row: Record<string, string> = {
    reference: 'K-0039',
    name: 'Yellowstone National Park',
    latitude: '44.428',
    longitude: '-110.5885',
    grid_square: 'DN44',
    state: 'WY',
    country: 'US',
    entity_id: '291',
    location_desc: 'Wyoming',
    is_active: '1',
    ...overrides,
  };

  const orderedColumns = [
    'reference',
    'name',
    'latitude',
    'longitude',
    'grid_square',
    'state',
    'country',
    'entity_id',
    'location_desc',
    'is_active',
  ];

  return orderedColumns.map((column) => escapeCsv(row[column] ?? '')).join(',');
}
