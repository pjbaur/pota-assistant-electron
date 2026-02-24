import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEquipmentPreset,
  createPlan,
  createPlanInput,
} from '../../helpers/fixtures';
import { createPlanId } from '../../../src/shared/types';
import { setupMockElectronAPI } from '../../helpers/mock-ipc';
import { usePlanStore } from '../../../src/renderer/stores/plan-store';
import {
  useEquipmentPresets,
  usePlan,
  usePlans,
} from '../../../src/renderer/hooks/use-plans';

describe('renderer/hooks/use-plans', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupMockElectronAPI();
    usePlanStore.getState().reset();
  });

  it('fetches plans and stores errors from failed fetches', async () => {
    const plan = createPlan({ id: createPlanId('550e8400-e29b-41d4-a716-446655440000') });
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    invoke.mockResolvedValueOnce({
      success: true,
      data: {
        plans: [plan],
        total: 1,
        hasMore: false,
      },
    });

    const { result } = renderHook(() => usePlans());

    await act(async () => {
      await result.current.fetchPlans();
    });

    expect(invoke).toHaveBeenCalledWith('plans:list', {});
    expect(usePlanStore.getState().plans).toEqual([plan]);
    expect(usePlanStore.getState().error).toBeNull();

    invoke.mockResolvedValueOnce({
      success: false,
      error: 'Unable to load plans',
      errorCode: 'INTERNAL_ERROR',
    });

    await act(async () => {
      await result.current.fetchPlans();
    });

    expect(usePlanStore.getState().error).toBe('Unable to load plans');
  });

  it('creates, updates, selects, and deletes plans', async () => {
    const createdPlan = createPlan({
      id: createPlanId('550e8400-e29b-41d4-a716-446655440001'),
      name: 'Created plan',
    });
    const updatedPlan = { ...createdPlan, name: 'Updated plan' };
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    invoke
      .mockResolvedValueOnce({ success: true, data: createdPlan })
      .mockResolvedValueOnce({ success: true, data: updatedPlan })
      .mockResolvedValueOnce({ success: true, data: { deleted: true } });

    const { result } = renderHook(() => usePlans());

    let createResult: typeof createdPlan | null = null;
    await act(async () => {
      createResult = await result.current.createPlan(createPlanInput());
    });

    expect(createResult).toEqual(createdPlan);
    expect(usePlanStore.getState().plans).toEqual([createdPlan]);

    await act(async () => {
      await result.current.updatePlan(createdPlan.id, { name: 'Updated plan' });
    });

    expect(invoke).toHaveBeenNthCalledWith(2, 'plans:update', {
      id: createdPlan.id,
      updates: { name: 'Updated plan' },
    });
    expect(usePlanStore.getState().plans[0]?.name).toBe('Updated plan');

    act(() => {
      result.current.selectPlan(updatedPlan);
    });
    expect(usePlanStore.getState().currentPlan).toEqual(updatedPlan);

    await act(async () => {
      await result.current.deletePlan(createdPlan.id);
    });

    expect(invoke).toHaveBeenNthCalledWith(3, 'plans:delete', { id: createdPlan.id });
    expect(usePlanStore.getState().plans).toEqual([]);
    expect(usePlanStore.getState().currentPlan).toBeNull();
  });

  it('auto-fetches plans when requested', async () => {
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValueOnce({
      success: true,
      data: {
        plans: [],
        total: 0,
        hasMore: false,
      },
    });

    renderHook(() => usePlans({ autoFetch: true }));

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('plans:list', {});
    });
  });

  it('fetches a single plan and handles null plan ids', async () => {
    const existingPlan = createPlan({ id: createPlanId('550e8400-e29b-41d4-a716-446655440002') });
    const fetchedPlan = createPlan({
      id: createPlanId('550e8400-e29b-41d4-a716-446655440003'),
      name: 'Fetched plan',
    });
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    usePlanStore.setState({ currentPlan: existingPlan });

    const nullHook = renderHook(() => usePlan(null));
    await act(async () => {
      await nullHook.result.current.fetchPlan();
    });

    expect(usePlanStore.getState().currentPlan).toBeNull();
    expect(invoke).not.toHaveBeenCalled();

    invoke.mockResolvedValueOnce({ success: true, data: fetchedPlan });

    const planHook = renderHook(() => usePlan(String(fetchedPlan.id)));
    await act(async () => {
      await planHook.result.current.fetchPlan();
    });

    expect(invoke).toHaveBeenCalledWith('plans:get', { id: String(fetchedPlan.id) });
    expect(usePlanStore.getState().currentPlan).toEqual(fetchedPlan);
  });

  it('manages local equipment presets', async () => {
    const { id: _id, ...presetInput } = createEquipmentPreset();

    const { result } = renderHook(() => useEquipmentPresets());

    await act(async () => {
      await result.current.fetchPresets();
    });

    let createdPreset: Awaited<ReturnType<typeof result.current.createPreset>> = null;
    await act(async () => {
      createdPreset = await result.current.createPreset(presetInput);
    });

    expect(createdPreset).not.toBeNull();
    expect(createdPreset?.id.startsWith('preset-')).toBe(true);
    expect(usePlanStore.getState().equipmentPresets).toHaveLength(1);

    await act(async () => {
      await result.current.updatePreset(createdPreset?.id ?? '', { name: 'Updated preset' });
    });

    expect(usePlanStore.getState().equipmentPresets[0]?.name).toBe('Updated preset');

    await act(async () => {
      await result.current.deletePreset(createdPreset?.id ?? '');
    });

    expect(usePlanStore.getState().equipmentPresets).toEqual([]);
  });
});
