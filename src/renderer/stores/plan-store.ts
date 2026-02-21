import { create } from 'zustand';
import type { Plan, EquipmentPreset } from '@shared/types';

export interface PlanWeather {
  temperatureHigh: number;
  temperatureLow: number;
  conditions: string;
  precipitationChance: number;
  windSpeed: number;
  windDirection: string;
  sunrise: string;
  sunset: string;
}

export interface PlanBandCondition {
  band: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  recommended: boolean;
  notes?: string;
}

// Use the shared Plan type directly
export type ActivationPlan = Plan;

// Re-export EquipmentPreset from shared types
export type { EquipmentPreset };

export type WizardStep = 'park' | 'datetime' | 'equipment' | 'bands' | 'review';

interface WizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  partialPlan: Partial<ActivationPlan>;
}

interface PlanState {
  plans: ActivationPlan[];
  currentPlan: ActivationPlan | null;
  equipmentPresets: EquipmentPreset[];
  wizard: WizardState;
  isLoading: boolean;
  error: string | null;
}

interface PlanActions {
  setPlans: (plans: ActivationPlan[]) => void;
  setCurrentPlan: (plan: ActivationPlan | null) => void;
  addPlan: (plan: ActivationPlan) => void;
  updatePlan: (id: string, updates: Partial<ActivationPlan>) => void;
  deletePlan: (id: string) => void;
  setEquipmentPresets: (presets: EquipmentPreset[]) => void;
  addEquipmentPreset: (preset: EquipmentPreset) => void;
  updateEquipmentPreset: (id: string, updates: Partial<EquipmentPreset>) => void;
  deleteEquipmentPreset: (id: string) => void;
  setWizardStep: (step: WizardStep) => void;
  nextWizardStep: () => void;
  previousWizardStep: () => void;
  updateWizardPlan: (updates: Partial<ActivationPlan>) => void;
  completeWizardStep: (step: WizardStep) => void;
  resetWizard: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const wizardSteps: WizardStep[] = ['park', 'datetime', 'equipment', 'bands', 'review'];

const initialWizardState: WizardState = {
  currentStep: 'park',
  completedSteps: [],
  partialPlan: {},
};

const initialState: PlanState = {
  plans: [],
  currentPlan: null,
  equipmentPresets: [],
  wizard: initialWizardState,
  isLoading: false,
  error: null,
};

export type PlanStore = PlanState & PlanActions;

export const usePlanStore = create<PlanStore>((set) => ({
  ...initialState,

  setPlans: (plans) => set({ plans }),

  setCurrentPlan: (currentPlan) => set({ currentPlan }),

  addPlan: (plan) =>
    set((state) => ({
      plans: [...state.plans, plan],
    })),

  updatePlan: (id, updates) =>
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === id ? { ...plan, ...updates } : plan
      ),
      currentPlan:
        state.currentPlan?.id === id
          ? { ...state.currentPlan, ...updates }
          : state.currentPlan,
    })),

  deletePlan: (id) =>
    set((state) => ({
      plans: state.plans.filter((plan) => plan.id !== id),
      currentPlan: state.currentPlan?.id === id ? null : state.currentPlan,
    })),

  setEquipmentPresets: (equipmentPresets) => set({ equipmentPresets }),

  addEquipmentPreset: (preset) =>
    set((state) => ({
      equipmentPresets: [...state.equipmentPresets, preset],
    })),

  updateEquipmentPreset: (id, updates) =>
    set((state) => ({
      equipmentPresets: state.equipmentPresets.map((preset) =>
        preset.id === id ? { ...preset, ...updates } : preset
      ),
    })),

  deleteEquipmentPreset: (id) =>
    set((state) => ({
      equipmentPresets: state.equipmentPresets.filter((preset) => preset.id !== id),
    })),

  setWizardStep: (currentStep) => set((state) => ({ wizard: { ...state.wizard, currentStep } })),

  nextWizardStep: () =>
    set((state) => {
      const currentIndex = wizardSteps.indexOf(state.wizard.currentStep);
      const nextStep = wizardSteps[currentIndex + 1];
      if (nextStep) {
        return { wizard: { ...state.wizard, currentStep: nextStep } };
      }
      return state;
    }),

  previousWizardStep: () =>
    set((state) => {
      const currentIndex = wizardSteps.indexOf(state.wizard.currentStep);
      const previousStep = wizardSteps[currentIndex - 1];
      if (previousStep) {
        return { wizard: { ...state.wizard, currentStep: previousStep } };
      }
      return state;
    }),

  updateWizardPlan: (updates) =>
    set((state) => ({
      wizard: {
        ...state.wizard,
        partialPlan: { ...state.wizard.partialPlan, ...updates },
      },
    })),

  completeWizardStep: (step) =>
    set((state) => ({
      wizard: {
        ...state.wizard,
        completedSteps: state.wizard.completedSteps.includes(step)
          ? state.wizard.completedSteps
          : [...state.wizard.completedSteps, step],
      },
    })),

  resetWizard: () => set({ wizard: initialWizardState }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
