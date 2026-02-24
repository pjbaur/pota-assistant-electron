import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useParkStore, type ParkStore } from '@renderer/stores/park-store';
import { usePlanStore, type PlanStore } from '@renderer/stores/plan-store';
import { useUIStore, type UIStore } from '@renderer/stores/ui-store';
import { setupMockElectronAPI } from './mock-ipc';

interface RenderWithProvidersOptions {
  initialRoute?: string;
  parkStoreState?: Partial<ParkStore>;
  planStoreState?: Partial<PlanStore>;
  uiStoreState?: Partial<UIStore>;
}

function resetUIStore(): void {
  useUIStore.persist?.clearStorage?.();
  useUIStore.setState({
    theme: 'system',
    resolvedTheme: 'light',
    sidebarOpen: true,
    sidebarWidth: 256,
    isGlobalLoading: false,
    loadingMessage: '',
    toasts: [],
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderResult {
  const {
    initialRoute = '/',
    parkStoreState,
    planStoreState,
    uiStoreState,
  } = options;

  setupMockElectronAPI();
  useParkStore.getState().reset();
  usePlanStore.getState().reset();
  resetUIStore();

  if (parkStoreState !== undefined) {
    useParkStore.setState(parkStoreState);
  }
  if (planStoreState !== undefined) {
    usePlanStore.setState(planStoreState);
  }
  if (uiStoreState !== undefined) {
    useUIStore.setState(uiStoreState);
  }

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {ui}
    </MemoryRouter>
  );
}
