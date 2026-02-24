/**
 * WeatherWidget Component
 *
 * Displays current weather conditions and multi-day forecast.
 */

import { useMemo } from 'react';
import type { WeatherData, WeatherCondition, HourlyForecast, DailyForecast } from '@shared/types/weather';
import { DataFreshness } from './data-freshness';

export interface WeatherWidgetProps {
  weatherData: WeatherData | null;
  isLoading?: boolean;
  className?: string;
}

/** Weather condition to icon/emoji mapping */
const CONDITION_ICONS: Record<WeatherCondition, { emoji: string; label: string }> = {
  'clear': { emoji: '\u2600\uFE0F', label: 'Clear' },
  'partly-cloudy': { emoji: '\u26C5', label: 'Partly Cloudy' },
  'cloudy': { emoji: '\u2601\uFE0F', label: 'Cloudy' },
  'fog': { emoji: '\uD83C\uDF2B\uFE0F', label: 'Fog' },
  'drizzle': { emoji: '\uD83C\uDF26\uFE0F', label: 'Drizzle' },
  'rain': { emoji: '\uD83C\uDF27\uFE0F', label: 'Rain' },
  'heavy-rain': { emoji: '\uD83C\uDF27\uFE0F', label: 'Heavy Rain' },
  'snow': { emoji: '\uD83C\uDF28\uFE0F', label: 'Snow' },
  'heavy-snow': { emoji: '\u2744\uFE0F', label: 'Heavy Snow' },
  'thunderstorm': { emoji: '\u26C8\uFE0F', label: 'Thunderstorm' },
};

/** Wind direction degrees to cardinal */
function windDirectionToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index] ?? 'N';
}

/** Loading skeleton */
function LoadingSkeleton(): JSX.Element {
  return (
    <div className="animate-pulse rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
      <div className="mb-4 h-8 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mb-4 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );
}

/** Empty state */
function EmptyState(): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
      <div className="mb-2 text-4xl">\uD83C\uDF2C\uFE0F</div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No weather data available
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        Select a park to see weather conditions
      </p>
    </div>
  );
}

/** Current conditions display */
function CurrentConditions({
  hourly,
}: {
  hourly: HourlyForecast;
}): JSX.Element {
  const icon = CONDITION_ICONS[hourly.condition];
  const windCardinal = windDirectionToCardinal(hourly.windDirection);

  return (
    <div className="flex items-center gap-4">
      {/* Weather icon and temp */}
      <div className="flex items-center gap-3">
        <span className="text-5xl" role="img" aria-label={icon.label}>
          {icon.emoji}
        </span>
        <div>
          <div className="text-3xl font-semibold text-slate-900 dark:text-white">
            {Math.round(hourly.temperatureC)}°
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {icon.label}
          </div>
        </div>
      </div>

      {/* Additional details */}
      <div className="ml-auto grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {/* Precipitation */}
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500"
          >
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          <span className="text-slate-600 dark:text-slate-300">
            {hourly.precipitationProbability}%
          </span>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-teal-500"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span className="text-slate-600 dark:text-slate-300">
            {hourly.humidity}%
          </span>
        </div>

        {/* Wind */}
        <div className="col-span-2 flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400"
          >
            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
            <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
            <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
          </svg>
          <span className="text-slate-600 dark:text-slate-300">
            {Math.round(hourly.windSpeedKmh)} km/h {windCardinal}
          </span>
        </div>

        {/* UV Index */}
        {hourly.uvIndex !== undefined && (
          <div className="col-span-2 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <span className="text-slate-600 dark:text-slate-300">
              UV {hourly.uvIndex}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Daily forecast card */
function DailyCard({ day, isToday }: { day: DailyForecast; isToday: boolean }): JSX.Element {
  const icon = CONDITION_ICONS[day.condition];
  const dayLabel = isToday ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="flex flex-col items-center rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {dayLabel}
      </span>
      <span className="my-1 text-2xl" role="img" aria-label={icon.label}>
        {icon.emoji}
      </span>
      <div className="text-center">
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {Math.round(day.tempMaxC)}°
        </span>
        <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
          {Math.round(day.tempMinC)}°
        </span>
      </div>
      {day.precipitationProbabilityMax > 0 && (
        <span className="mt-1 text-xs text-blue-500">
          {day.precipitationProbabilityMax}%
        </span>
      )}
    </div>
  );
}

export function WeatherWidget({
  weatherData,
  isLoading = false,
  className = '',
}: WeatherWidgetProps): JSX.Element {
  // Get current conditions (first hourly entry)
  const currentConditions = useMemo(() => {
    if (weatherData === null || weatherData.hourly.length === 0) {
      return null;
    }
    return weatherData.hourly[0] ?? null;
  }, [weatherData]);

  // Check if we have data
  const hasData = weatherData !== null && currentConditions !== null;

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Weather
        </h3>
        <DataFreshness fetchedAt={weatherData.fetchedAt} />
      </div>

      {/* Current conditions */}
      <div className="mb-4">
        <CurrentConditions
          hourly={currentConditions}
        />
      </div>

      {/* Daily forecast */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          7-Day Forecast
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {weatherData.daily.map((day) => (
            <DailyCard
              key={day.date}
              day={day}
              isToday={day.date === today}
            />
          ))}
        </div>
      </div>

      {/* Data source */}
      <div className="mt-3 text-right text-xs text-slate-400 dark:text-slate-500">
        Source: {weatherData.source}
      </div>
    </div>
  );
}
