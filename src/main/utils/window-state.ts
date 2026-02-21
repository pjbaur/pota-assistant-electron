/**
 * Window state persistence utility
 * Saves and restores window bounds and maximize state using electron-store
 */

import { BrowserWindow, screen } from 'electron';
import Store from 'electron-store';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

interface WindowStateStore {
  windowState: WindowState;
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;
const MIN_WIDTH = 1024;
const MIN_HEIGHT = 600;

// Create store instance
const store = new Store<WindowStateStore>() as Store<WindowStateStore>;

// Initialize default values if not set
if (store.get('windowState') === undefined) {
  store.set('windowState', {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    isMaximized: false,
  });
}

/**
 * Validate that window bounds are within available screen space
 */
function validateBounds(state: WindowState): WindowState {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Ensure window is not too large for screen
  const validatedState: WindowState = {
    ...state,
    width: Math.min(state.width, screenWidth),
    height: Math.min(state.height, screenHeight),
  };

  // If position is set, validate it's within screen bounds
  if (state.x !== undefined && state.y !== undefined) {
    // Check if the window would be visible (at least partially on screen)
    const isVisible =
      state.x < screenWidth - 100 &&
      state.y < screenHeight - 100 &&
      state.x > -state.width + 100 &&
      state.y > -state.height + 100;

    if (isVisible) {
      validatedState.x = state.x;
      validatedState.y = state.y;
    } else {
      // Reset to centered if off-screen - delete properties to indicate centering
      delete validatedState.x;
      delete validatedState.y;
    }
  }

  return validatedState;
}

/**
 * Get stored window state, with defaults and validation
 */
export function getWindowState(): WindowState {
  const storedState = store.get('windowState');
  return validateBounds(storedState);
}

/**
 * Save current window state to store
 */
export function saveWindowState(window: BrowserWindow): void {
  const isMaximized = window.isMaximized();

  // Only save bounds if not maximized
  if (!isMaximized) {
    const bounds = window.getBounds();
    store.set('windowState', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: false,
    });
  } else {
    // Keep previous bounds but update maximized state
    const currentState = store.get('windowState');
    store.set('windowState', {
      ...currentState,
      isMaximized: true,
    });
  }
}

/**
 * Apply stored window state to a BrowserWindow
 */
export function applyWindowState(window: BrowserWindow): void {
  const state = getWindowState();

  // Set size
  window.setSize(state.width, state.height);

  // Set position if stored, otherwise center
  if (state.x !== undefined && state.y !== undefined) {
    window.setPosition(state.x, state.y);
  } else {
    window.center();
  }

  // Restore maximized state
  if (state.isMaximized) {
    window.maximize();
  }
}

/**
 * Create window bounds options for BrowserWindow constructor
 */
export function getWindowBoundsOptions(): {
  width: number;
  height: number;
  x?: number;
  y?: number;
  minWidth: number;
  minHeight: number;
} {
  const state = getWindowState();

  const options: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    minWidth: number;
    minHeight: number;
  } = {
    width: state.width,
    height: state.height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
  };

  // Include position if available
  if (state.x !== undefined && state.y !== undefined) {
    options.x = state.x;
    options.y = state.y;
  }

  return options;
}

/**
 * Check if window should start maximized
 */
export function shouldStartMaximized(): boolean {
  const state = getWindowState();
  return state.isMaximized;
}

/**
 * Reset window state to defaults
 */
export function resetWindowState(): void {
  store.set('windowState', {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    isMaximized: false,
  });
}
