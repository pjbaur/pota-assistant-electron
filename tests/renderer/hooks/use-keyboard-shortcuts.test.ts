import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SHORTCUTS,
  useKeyboardShortcuts,
} from '../../../src/renderer/hooks/use-keyboard-shortcuts';
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
}

describe('renderer/hooks/use-keyboard-shortcuts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetUIStore();
    document.body.innerHTML = '';
  });

  it('opens, closes, and toggles the shortcuts dialog', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    expect(result.current.shortcutsDialogOpen).toBe(false);

    act(() => {
      result.current.openShortcutsDialog();
    });
    expect(result.current.shortcutsDialogOpen).toBe(true);

    act(() => {
      result.current.closeShortcutsDialog();
    });
    expect(result.current.shortcutsDialogOpen).toBe(false);

    act(() => {
      result.current.toggleShortcutsDialog();
    });
    expect(result.current.shortcutsDialogOpen).toBe(true);

    const escapeShortcut = result.current.shortcuts.find((shortcut) => shortcut.key === 'Escape');
    expect(escapeShortcut?.enabled).toBe(true);
  });

  it('handles global keyboard shortcuts for dialog and sidebar', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    const helpEvent = new KeyboardEvent('keydown', {
      key: '?',
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      window.dispatchEvent(helpEvent);
    });

    expect(helpEvent.defaultPrevented).toBe(true);
    expect(result.current.shortcutsDialogOpen).toBe(true);

    const sidebarEvent = new KeyboardEvent('keydown', {
      key: 'b',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      window.dispatchEvent(sidebarEvent);
    });

    expect(sidebarEvent.defaultPrevented).toBe(true);
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      window.dispatchEvent(escapeEvent);
    });

    expect(escapeEvent.defaultPrevented).toBe(true);
    expect(result.current.shortcutsDialogOpen).toBe(false);
  });

  it('skips non-escape shortcuts while typing in input fields', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    const input = document.createElement('input');
    document.body.appendChild(input);

    const sidebarEvent = new KeyboardEvent('keydown', {
      key: 'b',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      input.dispatchEvent(sidebarEvent);
    });

    expect(useUIStore.getState().sidebarOpen).toBe(true);

    act(() => {
      result.current.openShortcutsDialog();
    });
    expect(result.current.shortcutsDialogOpen).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      input.dispatchEvent(escapeEvent);
    });

    expect(result.current.shortcutsDialogOpen).toBe(false);
  });

  it('exports the documented default shortcuts', () => {
    expect(DEFAULT_SHORTCUTS).toEqual(
      expect.arrayContaining([
        { key: '?', description: 'Show keyboard shortcuts' },
        { key: 'Escape', description: 'Close dialogs/modals' },
        { key: 'b', ctrl: true, description: 'Toggle sidebar' },
      ])
    );
  });
});
