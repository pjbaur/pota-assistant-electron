/**
 * use-weather hook
 *
 * React hook for fetching weather data via IPC.
 */

import { useState, useEffect, useCallback } from 'react';
import { useIPC } from './use-ipc';
import type { WeatherData } from '@shared/types/weather';

export interface UseWeatherResult {
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch weather data for a location
 *
 * @param latitude - Location latitude (null to skip fetching)
 * @param longitude - Location longitude (null to skip fetching)
 * @returns Weather data, loading state, error, and refetch function
 */
export function useWeather(
  latitude: number | null,
  longitude: number | null
): UseWeatherResult {
  const { invoke } = useIPC();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (): Promise<void> => {
    // Skip if coordinates are not provided
    if (latitude === null || longitude === null) {
      setWeatherData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await invoke('weather:get', {
      latitude,
      longitude,
    });

    if (result.success && result.data) {
      setWeatherData(result.data as WeatherData);
    } else if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
  }, [latitude, longitude, invoke]);

  // Auto-fetch when coordinates change
  useEffect(() => {
    void fetchWeather();
  }, [fetchWeather]);

  return {
    weatherData,
    isLoading,
    error,
    refetch: fetchWeather,
  };
}
