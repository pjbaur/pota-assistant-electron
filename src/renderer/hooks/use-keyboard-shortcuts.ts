import { useEffect, useCallback, useMemo, useState } from 'react';
import { useUIStore } from '../stores/ui-store';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Key or key combination (e.g., 'Escape', '?', 'b') */
  key: string;
  /** Whether Ctrl/Cmd key must be pressed */
  ctrl?: boolean;
  /** Whether Shift key must be pressed */
  shift?: boolean;
  /** Whether Alt key must be pressed */
  alt?: boolean;
  /** Description of what the shortcut does */
  description: string;
  /** The action to perform */
  action: () => void;
  /** Whether this shortcut is currently enabled */
  enabled?: boolean;
}

/**
 * Return type for useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsResult {
  /** Whether the shortcuts dialog is visible */
  shortcutsDialogOpen: boolean;
  /** Open the shortcuts dialog */
  openShortcutsDialog: () => void;
  /** Close the shortcuts dialog */
  closeShortcutsDialog: () => void;
  /** Toggle the shortcuts dialog */
  toggleShortcutsDialog: () => void;
  /** List of all registered shortcuts */
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook for managing keyboard shortcuts in the renderer process.
 *
 * This hook provides web-context keyboard shortcuts that complement the native
 * application menu shortcuts. Use this for shortcuts that need to work in
 * the web layer (e.g., closing dialogs, showing help).
 *
 * Native menu shortcuts (Cmd/Ctrl+N, Cmd/Ctrl+B, etc.) are handled in
 * src/main/utils/menu.ts and should not be duplicated here.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { shortcutsDialogOpen, openShortcutsDialog, closeShortcutsDialog } = useKeyboardShortcuts();
 *
 *   return (
 *     <>
 *       <ShortcutsDialog open={shortcutsDialogOpen} onClose={closeShortcutsDialog} />
 *     </>
 *   );
 * }
 * ```
 */
export function useKeyboardShortcuts(): UseKeyboardShortcutsResult {
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const { toggleSidebar } = useUIStore();

  const openShortcutsDialog = useCallback((): void => {
    setShortcutsDialogOpen(true);
  }, []);

  const closeShortcutsDialog = useCallback((): void => {
    setShortcutsDialogOpen(false);
  }, []);

  const toggleShortcutsDialog = useCallback((): void => {
    setShortcutsDialogOpen((prev) => !prev);
  }, []);

  // Define available shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: '?',
        description: 'Show keyboard shortcuts',
        action: toggleShortcutsDialog,
      },
      {
        key: 'Escape',
        description: 'Close dialogs',
        action: closeShortcutsDialog,
        enabled: shortcutsDialogOpen,
      },
      {
        key: 'b',
        ctrl: true,
        description: 'Toggle sidebar',
        action: toggleSidebar,
      },
    ],
    [toggleShortcutsDialog, closeShortcutsDialog, shortcutsDialogOpen, toggleSidebar]
  );

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement;

      // Skip if user is typing in an input field
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape even in input fields
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        // Check if shortcut is enabled (default to true if not specified)
        if (shortcut.enabled === false) {
          continue;
        }

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl
          ? event.ctrlKey || event.metaKey // metaKey for Mac support
          : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        // Special handling for Escape - it should always work
        if (shortcut.key === 'Escape' && event.key === 'Escape') {
          event.preventDefault();
          shortcut.action();
          return;
        }

        // For shortcuts with Ctrl, we need to match the modifier
        if (shortcut.ctrl) {
          if (
            keyMatches &&
            (event.ctrlKey || event.metaKey) &&
            shiftMatches &&
            altMatches
          ) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        } else {
          // For shortcuts without Ctrl, match the key only
          if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);

  return {
    shortcutsDialogOpen,
    openShortcutsDialog,
    closeShortcutsDialog,
    toggleShortcutsDialog,
    shortcuts,
  };
}

/**
 * Default keyboard shortcuts for display in help dialogs.
 * This excludes shortcuts that have conditionals (like Escape only when dialog is open).
 */
export const DEFAULT_SHORTCUTS: Array<{
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}> = [
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Escape', description: 'Close dialogs/modals' },
  { key: 'b', ctrl: true, description: 'Toggle sidebar' },
  { key: 'n', ctrl: true, description: 'New plan (native menu)' },
  { key: 'e', ctrl: true, shift: true, description: 'Export plan (native menu)' },
  { key: ',', ctrl: true, description: 'Open settings (native menu)' },
  { key: '/', ctrl: true, description: 'Show keyboard shortcuts (native menu)' },
  { key: 'r', ctrl: true, description: 'Reload (native menu)' },
];
