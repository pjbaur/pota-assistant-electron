/**
 * Hook for fetching band recommendations via IPC
 */

import { useState, useCallback, useEffect } from 'react';
import { useIPC } from './use-ipc';
import type { DayBandForecast } from '@shared/types/band-types';

interface UseBandsResult {
  /** Band forecast data */
  forecast: DayBandForecast | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch band recommendations */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch band recommendations for a specific date
 */
export function useBands(date: Date | null): UseBandsResult {
  const [forecast, setForecast] = useState<DayBandForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { invoke } = useIPC();

  const fetchForecast = useCallback(async (): Promise<void> => {
    if (date === null) {
      setForecast(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const dateParts = date.toISOString().split('T');
    const dateStr = dateParts[0];
    if (dateStr === undefined) {
      setError('Failed to format date');
      setIsLoading(false);
      return;
    }
    const result = await invoke('bands:get:recommendations', { date: dateStr });

    if (result.success && result.data) {
      setForecast(result.data as DayBandForecast);
    } else if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
  }, [date, invoke]);

  // Auto-fetch when date changes
  useEffect(() => {
    void fetchForecast();
  }, [fetchForecast]);

  return {
    forecast,
    isLoading,
    error,
    refetch: fetchForecast,
  };
}
