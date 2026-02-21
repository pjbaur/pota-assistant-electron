import { useCallback, useEffect } from 'react';
import { usePlanStore } from '../stores/plan-store';
import type { ActivationPlan, EquipmentPreset } from '../stores/plan-store';
import type { PlanInput } from '@shared/types';
import { useIPC } from './use-ipc';

interface UsePlansOptions {
  autoFetch?: boolean;
}

export function usePlans(options: UsePlansOptions = {}): {
  plans: ActivationPlan[];
  currentPlan: ActivationPlan | null;
  equipmentPresets: EquipmentPreset[];
  isLoading: boolean;
  error: string | null;
  fetchPlans: () => Promise<void>;
  createPlan: (plan: PlanInput) => Promise<ActivationPlan | null>;
  updatePlan: (id: string, updates: Partial<PlanInput>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  selectPlan: (plan: ActivationPlan | null) => void;
} {
  const { autoFetch = false } = options;

  const {
    plans,
    currentPlan,
    equipmentPresets,
    isLoading,
    error,
    setPlans,
    setCurrentPlan,
    addPlan,
    updatePlan: updatePlanInStore,
    deletePlan: deletePlanFromStore,
    setLoading,
    setError,
  } = usePlanStore();

  const { invoke } = useIPC();

  const fetchPlans = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const result = await invoke('plans:list', {});

    if (result.success && result.data) {
      setPlans(result.data.plans);
    } else if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  }, [invoke, setPlans, setLoading, setError]);

  const createPlan = useCallback(
    async (planData: PlanInput): Promise<ActivationPlan | null> => {
      setLoading(true);

      const result = await invoke('plans:create', planData);

      if (result.success && result.data) {
        addPlan(result.data);
        setLoading(false);
        return result.data;
      }

      setLoading(false);
      return null;
    },
    [invoke, addPlan, setLoading]
  );

  const updatePlan = useCallback(
    async (id: string, updates: Partial<PlanInput>): Promise<void> => {
      const result = await invoke('plans:update', { id, updates });

      if (result.success && result.data) {
        updatePlanInStore(id, result.data);
      }
    },
    [invoke, updatePlanInStore]
  );

  const deletePlan = useCallback(
    async (id: string): Promise<void> => {
      await invoke('plans:delete', { id });
      deletePlanFromStore(id);
    },
    [invoke, deletePlanFromStore]
  );

  const selectPlan = useCallback(
    (plan: ActivationPlan | null): void => {
      setCurrentPlan(plan);
    },
    [setCurrentPlan]
  );

  useEffect(() => {
    if (autoFetch) {
      void fetchPlans();
    }
  }, [autoFetch, fetchPlans]);

  return {
    plans,
    currentPlan,
    equipmentPresets,
    isLoading,
    error,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    selectPlan,
  };
}

export function usePlan(planId: string | null): {
  plan: ActivationPlan | null;
  isLoading: boolean;
  error: string | null;
  fetchPlan: () => Promise<void>;
} {
  const { currentPlan, setCurrentPlan, setLoading, setError } = usePlanStore();

  const { invoke, isLoading, error: ipcError } = useIPC();

  const fetchPlan = useCallback(async (): Promise<void> => {
    if (!planId) {
      setCurrentPlan(null);
      return;
    }

    setLoading(true);

    const result = await invoke('plans:get', { id: planId });

    if (result.success && result.data) {
      setCurrentPlan(result.data);
    } else if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  }, [planId, invoke, setCurrentPlan, setLoading, setError]);

  return {
    plan: currentPlan,
    isLoading,
    error: ipcError?.message ?? null,
    fetchPlan,
  };
}

export function useEquipmentPresets(): {
  presets: EquipmentPreset[];
  isLoading: boolean;
  fetchPresets: () => Promise<void>;
  createPreset: (preset: Omit<EquipmentPreset, 'id'>) => Promise<EquipmentPreset | null>;
  updatePreset: (id: string, updates: Partial<EquipmentPreset>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
} {
  const { equipmentPresets, addEquipmentPreset, updateEquipmentPreset, deleteEquipmentPreset, setLoading } =
    usePlanStore();

  const { isLoading: ipcLoading } = useIPC();

  const fetchPresets = useCallback((): Promise<void> => {
    setLoading(true);
    // Note: Equipment presets are managed locally in the store for now
    // This could be extended to persist to IPC if needed
    setLoading(false);
    return Promise.resolve();
  }, [setLoading]);

  const createPreset = useCallback(
    (presetData: Omit<EquipmentPreset, 'id'>): Promise<EquipmentPreset | null> => {
      const newPreset: EquipmentPreset = {
        ...presetData,
        id: `preset-${Date.now()}`,
      };
      addEquipmentPreset(newPreset);
      return Promise.resolve(newPreset);
    },
    [addEquipmentPreset]
  );

  const updatePreset = useCallback(
    (id: string, updates: Partial<EquipmentPreset>): Promise<void> => {
      updateEquipmentPreset(id, updates);
      return Promise.resolve();
    },
    [updateEquipmentPreset]
  );

  const deletePreset = useCallback(
    (id: string): Promise<void> => {
      deleteEquipmentPreset(id);
      return Promise.resolve();
    },
    [deleteEquipmentPreset]
  );

  return {
    presets: equipmentPresets,
    isLoading: ipcLoading,
    fetchPresets,
    createPreset,
    updatePreset,
    deletePreset,
  };
}
