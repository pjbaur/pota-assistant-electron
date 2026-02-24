import { beforeEach, describe, expect, it } from 'vitest';
import {
  createEquipmentPreset,
  createPlan,
} from '../../helpers/fixtures';
import { createPlanId } from '../../../src/shared/types';
import { usePlanStore } from '../../../src/renderer/stores/plan-store';

describe('renderer/stores/plan-store', () => {
  beforeEach(() => {
    usePlanStore.getState().reset();
  });

  it('starts with expected initial state', () => {
    const state = usePlanStore.getState();

    expect(state.plans).toEqual([]);
    expect(state.currentPlan).toBeNull();
    expect(state.equipmentPresets).toEqual([]);
    expect(state.wizard.currentStep).toBe('park');
    expect(state.wizard.completedSteps).toEqual([]);
    expect(state.wizard.partialPlan).toEqual({});
  });

  it('adds, updates, and deletes plans while keeping current plan in sync', () => {
    const firstPlan = createPlan({ id: createPlanId('550e8400-e29b-41d4-a716-446655440000') });
    const secondPlan = createPlan({
      id: createPlanId('550e8400-e29b-41d4-a716-446655440001'),
      name: 'Second plan',
    });
    const store = usePlanStore.getState();

    store.addPlan(firstPlan);
    store.addPlan(secondPlan);
    store.setCurrentPlan(firstPlan);
    store.updatePlan(firstPlan.id, { name: 'Updated first plan' });

    expect(usePlanStore.getState().plans[0]?.name).toBe('Updated first plan');
    expect(usePlanStore.getState().currentPlan?.name).toBe('Updated first plan');

    store.deletePlan(firstPlan.id);
    expect(usePlanStore.getState().plans).toEqual([secondPlan]);
    expect(usePlanStore.getState().currentPlan).toBeNull();
  });

  it('manages equipment presets', () => {
    const firstPreset = createEquipmentPreset({ id: 'preset-1' });
    const secondPreset = createEquipmentPreset({ id: 'preset-2', name: 'Backpack' });
    const store = usePlanStore.getState();

    store.setEquipmentPresets([firstPreset]);
    store.addEquipmentPreset(secondPreset);
    store.updateEquipmentPreset('preset-2', { mode: 'CW', powerWatts: 10 });

    expect(usePlanStore.getState().equipmentPresets).toEqual([
      firstPreset,
      { ...secondPreset, mode: 'CW', powerWatts: 10 },
    ]);

    store.deleteEquipmentPreset('preset-1');
    expect(usePlanStore.getState().equipmentPresets).toEqual([
      { ...secondPreset, mode: 'CW', powerWatts: 10 },
    ]);
  });

  it('moves wizard steps forward/backward and tracks completion', () => {
    const store = usePlanStore.getState();

    store.nextWizardStep();
    expect(usePlanStore.getState().wizard.currentStep).toBe('datetime');

    store.setWizardStep('review');
    store.nextWizardStep();
    expect(usePlanStore.getState().wizard.currentStep).toBe('review');

    store.previousWizardStep();
    expect(usePlanStore.getState().wizard.currentStep).toBe('bands');

    store.setWizardStep('park');
    store.previousWizardStep();
    expect(usePlanStore.getState().wizard.currentStep).toBe('park');

    store.updateWizardPlan({ name: 'Partial plan' });
    store.completeWizardStep('park');
    store.completeWizardStep('park');

    expect(usePlanStore.getState().wizard.partialPlan).toEqual({ name: 'Partial plan' });
    expect(usePlanStore.getState().wizard.completedSteps).toEqual(['park']);

    store.resetWizard();
    expect(usePlanStore.getState().wizard).toEqual({
      currentStep: 'park',
      completedSteps: [],
      partialPlan: {},
    });
  });

  it('resets all state back to defaults', () => {
    const store = usePlanStore.getState();

    store.addPlan(createPlan());
    store.setCurrentPlan(createPlan());
    store.addEquipmentPreset(createEquipmentPreset());
    store.setWizardStep('review');
    store.completeWizardStep('review');
    store.setLoading(true);
    store.setError('failed');

    store.reset();

    const state = usePlanStore.getState();
    expect(state.plans).toEqual([]);
    expect(state.currentPlan).toBeNull();
    expect(state.equipmentPresets).toEqual([]);
    expect(state.wizard).toEqual({
      currentStep: 'park',
      completedSteps: [],
      partialPlan: {},
    });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});
