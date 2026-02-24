import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { Toast } from '../components/ui/toast';

export type Theme = 'light' | 'dark' | 'system';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

interface UIState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  temperatureUnit: TemperatureUnit;
  sidebarOpen: boolean;
  sidebarWidth: number;
  isGlobalLoading: boolean;
  loadingMessage: string;
  toasts: Toast[];
}

interface UIActions {
  setTheme: (theme: Theme) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setGlobalLoading: (isLoading: boolean, message?: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

const initialState: UIState = {
  theme: 'system',
  resolvedTheme: resolveTheme('system'),
  temperatureUnit: 'celsius',
  sidebarOpen: true,
  sidebarWidth: 256,
  isGlobalLoading: false,
  loadingMessage: '',
  toasts: [],
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {
    /* no-op */
  },
  removeItem: () => {
    /* no-op */
  },
};

function getPersistStorage(): StateStorage {
  if (typeof window === 'undefined') {
    return noopStorage;
  }

  const storage = window.localStorage as Partial<StateStorage> | undefined;
  if (
    storage !== undefined &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function' &&
    typeof storage.removeItem === 'function'
  ) {
    return storage as StateStorage;
  }

  return noopStorage;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme);
        set({ theme, resolvedTheme });

        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(resolvedTheme);
        }
      },

      setTemperatureUnit: (temperatureUnit) => set({ temperatureUnit }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),

      setGlobalLoading: (isGlobalLoading, loadingMessage = '') =>
        set({ isGlobalLoading, loadingMessage }),

      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const newToast: Toast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));
        return id;
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),

      clearToasts: () => set({ toasts: [] }),
    }),
    {
      name: 'pota-ui-settings',
      storage: createJSONStorage(getPersistStorage),
      partialize: (state) => ({
        theme: state.theme,
        temperatureUnit: state.temperatureUnit,
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
      }),
    }
  )
);

export function initializeTheme(): void {
  const state = useUIStore.getState();
  const resolvedTheme = resolveTheme(state.theme);

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);

    useUIStore.setState({ resolvedTheme });
  }
}
