import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from '../../../src/renderer/hooks/use-theme';
import { useUIStore } from '../../../src/renderer/stores/ui-store';

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

function createMatchMediaResult(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
}

describe('renderer/hooks/use-theme', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.matchMedia = vi
      .fn()
      .mockReturnValue(createMatchMediaResult(false)) as typeof window.matchMedia;
    resetUIStore();
  });

  it('cycles theme values and exposes theme flags', () => {
    useUIStore.getState().setTheme('light');
    const { result } = renderHook(() => useTheme());

    expect(result.current.isLight).toBe(true);
    expect(result.current.isDark).toBe(false);
    expect(result.current.isSystem).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(useUIStore.getState().theme).toBe('dark');
    expect(useUIStore.getState().resolvedTheme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });
    expect(useUIStore.getState().theme).toBe('system');

    act(() => {
      result.current.toggleTheme();
    });
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('registers and cleans up media query listeners in system mode', () => {
    let changeHandler: (() => void) | null = null;
    const addEventListener = vi.fn((_event: string, listener: () => void) => {
      changeHandler = listener;
    });
    const removeEventListener = vi.fn();
    const mediaQuery = {
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener,
      removeEventListener,
      dispatchEvent: vi.fn(),
    };

    window.matchMedia = vi.fn().mockReturnValue(mediaQuery) as typeof window.matchMedia;

    useUIStore.setState({ theme: 'system', resolvedTheme: 'light' });

    const { unmount } = renderHook(() => useTheme());

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    mediaQuery.matches = false;
    act(() => {
      changeHandler?.();
    });

    expect(useUIStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('does not register system listeners when theme is fixed', () => {
    const addEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener,
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as typeof window.matchMedia;

    useUIStore.setState({ theme: 'dark', resolvedTheme: 'dark' });
    renderHook(() => useTheme());

    expect(addEventListener).not.toHaveBeenCalled();
  });
});
