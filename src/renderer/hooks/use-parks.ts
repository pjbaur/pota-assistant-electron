import { useCallback, useEffect } from 'react';
import { useParkStore, type ParkSearchFilters } from '../stores/park-store';
import type { Park } from '@shared/types';
import { useIPC } from './use-ipc';

interface UseParksOptions {
  autoFetch?: boolean;
  initialFilters?: Partial<ParkSearchFilters>;
}

export function useParks(options: UseParksOptions = {}): {
  parks: Park[];
  selectedPark: Park | null;
  favorites: string[];
  filters: ParkSearchFilters;
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  currentPage: number;
  pageSize: number;
  searchParks: (searchFilters: Partial<ParkSearchFilters>) => Promise<void>;
  selectPark: (park: Park | null) => void;
  toggleFavorite: (parkId: string) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  clearFilters: () => void;
} {
  const { autoFetch = false, initialFilters } = options;

  const {
    parks,
    selectedPark,
    favorites,
    filters,
    isLoading,
    error,
    totalResults,
    currentPage,
    pageSize,
    setParks,
    setSelectedPark,
    toggleFavorite: toggleFavoriteInStore,
    setFilters,
    setLoading,
    setError,
    setTotalResults,
    setCurrentPage,
    clearFilters: clearFiltersFromStore,
  } = useParkStore();

  const { invoke } = useIPC();

  const searchParks = useCallback(
    async (searchFilters: Partial<ParkSearchFilters>): Promise<void> => {
      setLoading(true);
      setError(null);

      // Merge new filters with existing ones
      const mergedFilters = { ...filters, ...searchFilters };
      setFilters(searchFilters);

      const result = await invoke('parks:search', {
        query: mergedFilters.query,
        entityId: mergedFilters.entity,
        programId: mergedFilters.program,
        limit: pageSize,
        offset: 0,
      });

      if (result.success && result.data) {
        setParks(result.data.parks);
        setTotalResults(result.data.total);
        setCurrentPage(1);
      } else if (result.error) {
        setError(result.error);
      }

      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageSize, invoke]
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (parks.length >= totalResults || isLoading) {
      return;
    }

    setLoading(true);

    const nextPage = currentPage + 1;
    const result = await invoke('parks:search', {
      query: filters.query,
      entityId: filters.entity,
      programId: filters.program,
      limit: pageSize,
      offset: currentPage * pageSize,
    });

    if (result.success && result.data) {
      setParks([...parks, ...result.data.parks]);
      setCurrentPage(nextPage);
    }

    setLoading(false);
  }, [
    parks,
    totalResults,
    isLoading,
    currentPage,
    pageSize,
    filters,
    invoke,
    setParks,
    setCurrentPage,
    setLoading,
  ]);

  const refresh = useCallback(async (): Promise<void> => {
    await searchParks(filters);
  }, [filters, searchParks]);

  const selectPark = useCallback(
    (park: Park | null): void => {
      setSelectedPark(park);
    },
    [setSelectedPark]
  );

  const toggleFavorite = useCallback(
    (parkId: string): void => {
      toggleFavoriteInStore(parkId);
      // Note: IPC call to persist favorite would go here
    },
    [toggleFavoriteInStore]
  );

  const clearFilters = useCallback((): void => {
    clearFiltersFromStore();
    void searchParks({
      query: '',
      entity: undefined,
      program: undefined,
      isActive: undefined,
      hasAccessMethod: undefined,
    });
  }, [clearFiltersFromStore, searchParks]);

  useEffect(() => {
    if (autoFetch) {
      if (initialFilters) {
        setFilters(initialFilters);
      }
      void searchParks(initialFilters ?? {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return {
    parks,
    selectedPark,
    favorites,
    filters,
    isLoading,
    error,
    totalResults,
    currentPage,
    pageSize,
    searchParks,
    selectPark,
    toggleFavorite,
    loadMore,
    refresh,
    clearFilters,
  };
}

export function usePark(parkId: string | null): {
  park: Park | null;
  isLoading: boolean;
  error: string | null;
  fetchPark: () => Promise<void>;
} {
  const { selectedPark, setSelectedPark, setLoading, setError } = useParkStore();

  const { invoke, isLoading, error: ipcError } = useIPC();

  const fetchPark = useCallback(async (): Promise<void> => {
    if (!parkId) {
      setSelectedPark(null);
      return;
    }

    setLoading(true);

    const result = await invoke('parks:get', { reference: parkId });

    if (result.success && result.data) {
      setSelectedPark(result.data);
    } else if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  }, [parkId, invoke, setSelectedPark, setLoading, setError]);

  return {
    park: selectedPark,
    isLoading,
    error: ipcError?.message ?? null,
    fetchPark,
  };
}
