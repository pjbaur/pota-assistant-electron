import { beforeEach, describe, expect, it } from 'vitest';
import { createPark } from '../../helpers/fixtures';
import { createParkReference } from '../../../src/shared/types';
import { useParkStore } from '../../../src/renderer/stores/park-store';

describe('renderer/stores/park-store', () => {
  beforeEach(() => {
    useParkStore.getState().reset();
  });

  it('starts with expected initial state', () => {
    const state = useParkStore.getState();

    expect(state.parks).toEqual([]);
    expect(state.selectedPark).toBeNull();
    expect(state.favorites).toEqual([]);
    expect(state.filters).toEqual({ query: '' });
    expect(state.totalResults).toBe(0);
    expect(state.currentPage).toBe(1);
    expect(state.pageSize).toBe(20);
  });

  it('adds, removes, and toggles favorites without duplicates', () => {
    const store = useParkStore.getState();

    store.addFavorite('K-0001');
    store.addFavorite('K-0001');
    expect(useParkStore.getState().favorites).toEqual(['K-0001']);

    store.toggleFavorite('K-0002');
    expect(useParkStore.getState().favorites).toEqual(['K-0001', 'K-0002']);

    store.toggleFavorite('K-0001');
    expect(useParkStore.getState().favorites).toEqual(['K-0002']);

    store.removeFavorite('K-0002');
    expect(useParkStore.getState().favorites).toEqual([]);
  });

  it('updates filters and resets paging when filters change', () => {
    const store = useParkStore.getState();

    store.setCurrentPage(3);
    store.setFilters({ query: 'yellowstone', entity: 'US' });

    const state = useParkStore.getState();
    expect(state.filters).toEqual({ query: 'yellowstone', entity: 'US' });
    expect(state.currentPage).toBe(1);

    store.clearFilters();
    expect(useParkStore.getState().filters).toEqual({ query: '' });
    expect(useParkStore.getState().currentPage).toBe(1);
  });

  it('updates pagination and selected park values', () => {
    const park = createPark({ reference: createParkReference('K-1000') });
    const secondPark = createPark({ reference: createParkReference('K-1001') });
    const store = useParkStore.getState();

    store.setParks([park, secondPark]);
    store.setSelectedPark(park);
    store.setTotalResults(2);
    store.setCurrentPage(4);
    store.setPageSize(50);

    const state = useParkStore.getState();
    expect(state.parks).toEqual([park, secondPark]);
    expect(state.selectedPark).toEqual(park);
    expect(state.totalResults).toBe(2);
    expect(state.pageSize).toBe(50);
    expect(state.currentPage).toBe(1);
  });

  it('resets all state back to defaults', () => {
    const store = useParkStore.getState();

    store.setParks([createPark()]);
    store.setSelectedPark(createPark());
    store.setFilters({ query: 'abc', entity: 'US' });
    store.setError('failed');
    store.setLoading(true);
    store.addFavorite('K-1111');
    store.setTotalResults(10);
    store.setCurrentPage(2);
    store.setPageSize(25);

    store.reset();

    const state = useParkStore.getState();
    expect(state.parks).toEqual([]);
    expect(state.selectedPark).toBeNull();
    expect(state.favorites).toEqual([]);
    expect(state.filters).toEqual({ query: '' });
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.totalResults).toBe(0);
    expect(state.currentPage).toBe(1);
    expect(state.pageSize).toBe(20);
  });
});
