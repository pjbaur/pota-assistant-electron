// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPark, createPlan, createPlanInput } from '../helpers/fixtures';
import { setupMockElectronAPI } from '../helpers/mock-ipc';
import { useParks } from '../../src/renderer/hooks/use-parks';
import { usePlans } from '../../src/renderer/hooks/use-plans';
import { useParkStore } from '../../src/renderer/stores/park-store';
import { usePlanStore } from '../../src/renderer/stores/plan-store';

describe('integration/hook-store', () => {
  beforeEach(() => {
    setupMockElectronAPI();
    useParkStore.getState().reset();
    usePlanStore.getState().reset();
    vi.clearAllMocks();
  });

  it('syncs park search results from useParks into the park store', async () => {
    const park = createPark();

    vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
      success: true,
      data: {
        parks: [park],
        total: 1,
        hasMore: false,
      },
    } as never);

    const { result } = renderHook(() => useParks());

    await act(async () => {
      await result.current.searchParks({ query: 'Yellowstone' });
    });

    expect(window.electronAPI.invoke).toHaveBeenCalledWith('parks:search', {
      query: 'Yellowstone',
      entityId: undefined,
      programId: undefined,
      limit: 20,
      offset: 0,
    });

    const state = useParkStore.getState();
    expect(state.filters.query).toBe('Yellowstone');
    expect(state.totalResults).toBe(1);
    expect(state.parks).toEqual([park]);
    expect(state.currentPage).toBe(1);
  });

  it('syncs created plans from usePlans into the plan store', async () => {
    const input = createPlanInput();
    const createdPlan = createPlan({ parkReference: input.parkReference });

    vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
      success: true,
      data: createdPlan,
    } as never);

    const { result } = renderHook(() => usePlans());

    let returnedPlan = null;
    await act(async () => {
      returnedPlan = await result.current.createPlan(input);
    });

    expect(window.electronAPI.invoke).toHaveBeenCalledWith('plans:create', input);
    expect(returnedPlan).toEqual(createdPlan);

    const state = usePlanStore.getState();
    expect(state.plans).toHaveLength(1);
    expect(state.plans[0]).toEqual(createdPlan);
    expect(state.isLoading).toBe(false);
  });
});
