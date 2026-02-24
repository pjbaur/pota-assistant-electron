import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPark } from '../../helpers/fixtures';
import { createParkReference } from '../../../src/shared/types';
import { setupMockElectronAPI } from '../../helpers/mock-ipc';
import { useParkStore } from '../../../src/renderer/stores/park-store';
import { usePark, useParks } from '../../../src/renderer/hooks/use-parks';

describe('renderer/hooks/use-parks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupMockElectronAPI();
    useParkStore.getState().reset();
  });

  it('searches parks and updates store state', async () => {
    const park = createPark({ reference: createParkReference('K-1000') });
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValueOnce({
      success: true,
      data: {
        parks: [park],
        total: 1,
        hasMore: false,
      },
    });

    const { result } = renderHook(() => useParks());

    await act(async () => {
      await result.current.searchParks({ query: 'yellowstone', entity: 'US' });
    });

    expect(invoke).toHaveBeenCalledWith('parks:search', {
      query: 'yellowstone',
      entityId: 'US',
      programId: undefined,
      limit: 20,
      offset: 0,
    });

    const state = useParkStore.getState();
    expect(state.parks).toEqual([park]);
    expect(state.totalResults).toBe(1);
    expect(state.currentPage).toBe(1);
    expect(state.filters).toEqual({ query: 'yellowstone', entity: 'US' });
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('loads additional pages when more results exist', async () => {
    const firstPark = createPark({ reference: createParkReference('K-1001') });
    const secondPark = createPark({ reference: createParkReference('K-1002') });
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    useParkStore.setState({
      parks: [firstPark],
      totalResults: 2,
      currentPage: 1,
      pageSize: 20,
      filters: { query: 'test' },
      isLoading: false,
    });

    invoke.mockResolvedValueOnce({
      success: true,
      data: {
        parks: [secondPark],
        total: 2,
        hasMore: false,
      },
    });

    const { result } = renderHook(() => useParks());

    await act(async () => {
      await result.current.loadMore();
    });

    expect(invoke).toHaveBeenCalledWith('parks:search', {
      query: 'test',
      entityId: undefined,
      programId: undefined,
      limit: 20,
      offset: 20,
    });
    expect(useParkStore.getState().parks).toEqual([firstPark, secondPark]);
    expect(useParkStore.getState().currentPage).toBe(2);

    invoke.mockClear();
    act(() => {
      useParkStore.setState({ totalResults: 2 });
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(invoke).not.toHaveBeenCalled();
  });

  it('auto-fetches on mount and clears filters', async () => {
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;
    invoke
      .mockResolvedValueOnce({
        success: true,
        data: {
          parks: [],
          total: 0,
          hasMore: false,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          parks: [],
          total: 0,
          hasMore: false,
        },
      });

    const { result } = renderHook(() =>
      useParks({ autoFetch: true, initialFilters: { query: 'initial', entity: 'US' } })
    );

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('parks:search', {
        query: 'initial',
        entityId: 'US',
        programId: undefined,
        limit: 20,
        offset: 0,
      });
    });

    await act(async () => {
      result.current.clearFilters();
    });

    await waitFor(() => {
      expect(invoke).toHaveBeenLastCalledWith('parks:search', {
        query: '',
        entityId: undefined,
        programId: undefined,
        limit: 20,
        offset: 0,
      });
    });

    const state = useParkStore.getState();
    expect(state.filters).toMatchObject({ query: '' });
    expect(state.currentPage).toBe(1);
  });

  it('fetches a single park by id and handles null ids', async () => {
    const selectedPark = createPark({ reference: createParkReference('K-1003') });
    const fetchedPark = createPark({ reference: createParkReference('K-1004') });
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    useParkStore.setState({ selectedPark });

    const nullHook = renderHook(() => usePark(null));
    await act(async () => {
      await nullHook.result.current.fetchPark();
    });

    expect(useParkStore.getState().selectedPark).toBeNull();
    expect(invoke).not.toHaveBeenCalled();

    invoke.mockResolvedValueOnce({ success: true, data: fetchedPark });

    const fetchHook = renderHook(() => usePark('K-1004'));
    await act(async () => {
      await fetchHook.result.current.fetchPark();
    });

    expect(invoke).toHaveBeenCalledWith('parks:get', { reference: 'K-1004' });
    expect(useParkStore.getState().selectedPark).toEqual(fetchedPark);
  });
});
