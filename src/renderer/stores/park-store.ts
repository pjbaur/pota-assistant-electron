import { create } from 'zustand';
import type { Park } from '@shared/types';

export interface ParkSearchFilters {
  query: string;
  entity?: string;
  program?: string;
  isActive?: boolean;
  hasAccessMethod?: string;
  favoritesOnly?: boolean;
}

interface ParkState {
  parks: Park[];
  selectedPark: Park | null;
  favorites: string[];
  filters: ParkSearchFilters;
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  currentPage: number;
  pageSize: number;
}

interface ParkActions {
  setParks: (parks: Park[]) => void;
  setSelectedPark: (park: Park | null) => void;
  addFavorite: (parkId: string) => void;
  removeFavorite: (parkId: string) => void;
  toggleFavorite: (parkId: string) => void;
  setFilters: (filters: Partial<ParkSearchFilters>) => void;
  clearFilters: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setTotalResults: (total: number) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

const initialState: ParkState = {
  parks: [],
  selectedPark: null,
  favorites: [],
  filters: {
    query: '',
  },
  isLoading: false,
  error: null,
  totalResults: 0,
  currentPage: 1,
  pageSize: 20,
};

export type ParkStore = ParkState & ParkActions;

export const useParkStore = create<ParkStore>((set) => ({
  ...initialState,

  setParks: (parks) => set({ parks }),

  setSelectedPark: (selectedPark) => set({ selectedPark }),

  addFavorite: (parkId) =>
    set((state) => ({
      favorites: state.favorites.includes(parkId)
        ? state.favorites
        : [...state.favorites, parkId],
    })),

  removeFavorite: (parkId) =>
    set((state) => ({
      favorites: state.favorites.filter((id) => id !== parkId),
    })),

  toggleFavorite: (parkId) =>
    set((state) => ({
      favorites: state.favorites.includes(parkId)
        ? state.favorites.filter((id) => id !== parkId)
        : [...state.favorites, parkId],
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      currentPage: 1,
    })),

  clearFilters: () =>
    set({
      filters: { query: '' },
      currentPage: 1,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setTotalResults: (totalResults) => set({ totalResults }),

  setCurrentPage: (currentPage) => set({ currentPage }),

  setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),

  reset: () => set(initialState),
}));
