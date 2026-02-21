/**
 * Weather-related types for POTA Activation Planner
 */

import type { ISODateString } from './park';

/** Weather condition codes */
export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'snow'
  | 'heavy-snow'
  | 'thunderstorm';

/** Single hour weather forecast */
export interface HourlyForecast {
  /** ISO timestamp for this hour */
  time: ISODateString;
  /** Temperature in Celsius */
  temperatureC: number;
  /** Temperature in Fahrenheit */
  temperatureF: number;
  /** Relative humidity percentage (0-100) */
  humidity: number;
  /** Wind speed in km/h */
  windSpeedKmh: number;
  /** Wind direction in degrees (0-360) */
  windDirection: number;
  /** Wind gust speed in km/h */
  windGustKmh?: number;
  /** Probability of precipitation (0-100) */
  precipitationProbability: number;
  /** Precipitation amount in mm */
  precipitationMm?: number;
  /** Weather condition */
  condition: WeatherCondition;
  /** UV index (0-11+) */
  uvIndex?: number;
  /** Visibility in km */
  visibilityKm?: number;
}

/** Daily weather forecast */
export interface DailyForecast {
  /** ISO date string (YYYY-MM-DD) */
  date: ISODateString;
  /** Maximum temperature in Celsius */
  tempMaxC: number;
  /** Maximum temperature in Fahrenheit */
  tempMaxF: number;
  /** Minimum temperature in Celsius */
  tempMinC: number;
  /** Minimum temperature in Fahrenheit */
  tempMinF: number;
  /** Total precipitation in mm */
  precipitationMm: number;
  /** Maximum precipitation probability */
  precipitationProbabilityMax: number;
  /** Weather condition summary for the day */
  condition: WeatherCondition;
  /** Sunrise time (HH:mm) */
  sunrise: string;
  /** Sunset time (HH:mm) */
  sunset: string;
  /** Maximum UV index */
  uvIndexMax: number;
  /** Maximum wind speed in km/h */
  windSpeedMaxKmh: number;
  /** Dominant wind direction */
  windDirectionDominant: number;
}

/** Complete weather data for a location */
export interface WeatherData {
  /** Latitude of weather data point */
  latitude: number;
  /** Longitude of weather data point */
  longitude: number;
  /** ISO timestamp when data was fetched */
  fetchedAt: ISODateString;
  /** Data source attribution */
  source: string;
  /** Timezone for the location */
  timezone: string;
  /** Hourly forecasts (up to 48 hours) */
  hourly: HourlyForecast[];
  /** Daily forecasts (up to 7 days) */
  daily: DailyForecast[];
}

/** Parameters for weather request */
export interface WeatherRequestParams {
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
  /** Number of hours to forecast (max 48) */
  hourlyCount?: number;
  /** Number of days to forecast (max 7) */
  dailyCount?: number;
  /** Timezone override */
  timezone?: string;
}

/** Cached weather entry */
export interface CachedWeather {
  /** Cache key (lat,lon rounded) */
  key: string;
  /** The cached weather data */
  data: WeatherData;
  /** ISO timestamp when cache expires */
  expiresAt: ISODateString;
}
