import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initializeTheme,
  useUIStore,
} from '../../../src/renderer/stores/ui-store';

function resetUIStore(): void {
  useUIStore.setState({
    theme: 'system',
    resolvedTheme: 'light',
    sidebarOpen: true,
    sidebarWidth: 256,
    isGlobalLoading: false,
    loadingMessage: '',
    toasts: [],
  });
  document.documentElement.classList.remove('light', 'dark');
}

describe('renderer/stores/ui-store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetUIStore();
  });

  it('sets theme and updates document root class', () => {
    useUIStore.getState().setTheme('dark');

    expect(useUIStore.getState().theme).toBe('dark');
    expect(useUIStore.getState().resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('toggles sidebar and global loading state', () => {
    const store = useUIStore.getState();

    store.toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    store.setSidebarOpen(true);
    store.setSidebarWidth(300);
    store.setGlobalLoading(true, 'Loading parks...');

    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.sidebarWidth).toBe(300);
    expect(state.isGlobalLoading).toBe(true);
    expect(state.loadingMessage).toBe('Loading parks...');
  });

  it('adds, removes, and clears toasts', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const id = useUIStore.getState().addToast({
      title: 'Saved',
      description: 'Plan saved successfully',
      variant: 'success',
    });

    expect(id.startsWith('toast-1700000000000-')).toBe(true);
    expect(useUIStore.getState().toasts).toHaveLength(1);
    expect(useUIStore.getState().toasts[0]?.id).toBe(id);

    useUIStore.getState().removeToast(id);
    expect(useUIStore.getState().toasts).toEqual([]);

    useUIStore.getState().addToast({ title: 'One', variant: 'default' });
    useUIStore.getState().addToast({ title: 'Two', variant: 'default' });
    expect(useUIStore.getState().toasts).toHaveLength(2);

    useUIStore.getState().clearToasts();
    expect(useUIStore.getState().toasts).toEqual([]);
  });

  it('initializes theme from current preference', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as typeof window.matchMedia;

    useUIStore.setState({ theme: 'system', resolvedTheme: 'light' });

    initializeTheme();

    expect(useUIStore.getState().resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});
