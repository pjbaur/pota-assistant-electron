/**
 * POTA Activation Planner - Electron Main Process Entry
 * Handles window creation, security settings, and app lifecycle
 */

import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, closeDatabase, runMigrations } from './database';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { registerPlaceholderHandlers } from './ipc';
import { createApplicationMenu } from './utils/menu';
import {
  getWindowBoundsOptions,
  saveWindowState,
  applyWindowState,
  shouldStartMaximized,
} from './utils/window-state';
import { getAppPaths } from './utils/app-paths';

// Global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

// Development mode check
const isDevelopment =
  process.env['NODE_ENV'] === 'development' || process.env['VITE_DEV_SERVER_URL'] !== undefined;

/**
 * Set up Content Security Policy
 */
function setupContentSecurityPolicy(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // In development, allow Vite dev server connections
    const devServerOrigin = isDevelopment ? ' http://localhost:5173' : '';

    const csp = [
      "default-src 'self'",
      // Allow scripts from self and Vite dev server in development
      `script-src 'self'${isDevelopment ? " 'unsafe-eval' 'unsafe-inline' http://localhost:5173" : ""}`,
      // Allow styles from self and inline styles (required for some UI libraries)
      "style-src 'self' 'unsafe-inline'",
      // Allow images from self, data URIs, and map tile servers
      "img-src 'self' data: https://*.tile.openstreetmap.org https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://*.openstreetmap.org",
      // Allow fonts from self and data URIs
      "font-src 'self' data:",
      // Allow connect to APIs and Vite dev server
      `connect-src 'self'${devServerOrigin} https://api.pota.app https://pota.app https://api.open-meteo.com https://api.openweathermap.org`,
      // Disallow object, embed, and applet tags
      "object-src 'none'",
      // Disallow framing (clickjacking protection)
      "frame-src 'none'",
    ].join('; ');

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}

/**
 * Initialize database and run migrations
 */
async function initializeDatabaseLayer(): Promise<void> {
  console.log('Initializing database...');
  await initializeDatabase();
  console.log('Database initialized');

  console.log('Running migrations...');
  const migrationsApplied = runMigrations();
  console.log(`Applied ${migrationsApplied} migration(s)`);
}

/**
 * Create the main application window with security settings
 */
function createWindow(): void {
  // Get persisted window bounds
  const boundsOptions = getWindowBoundsOptions();

  // Preload script path (must be .cjs for CommonJS compatibility with ESM package)
  const preloadPath = path.join(__dirname, '..', 'preload', 'index.cjs');

  // Create the browser window with security settings
  mainWindow = new BrowserWindow({
    ...boundsOptions,
    show: false, // Don't show until ready
    title: 'POTA Activation Planner',
    icon: path.join(__dirname, '..', '..', 'resources', 'icon.png'),
    webPreferences: {
      // Security: Context isolation enabled
      contextIsolation: true,
      // Security: Node integration disabled in renderer
      nodeIntegration: false,
      // Security: Web security enabled
      webSecurity: true,
      // Preload script for safe IPC communication
      preload: preloadPath,
      // Disable sandbox for sql.js compatibility
      sandbox: false,
      // Spellcheck enabled
      spellcheck: true,
    },
    // Window appearance
    backgroundColor: '#1a1a2e', // Dark theme background
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 15, y: 15 }, // macOS traffic light position
  });

  // Apply persisted window state (position and maximize)
  applyWindowState(mainWindow);

  // Load the renderer
  loadRenderer();

  // Show window when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    // Restore maximize state after showing
    if (shouldStartMaximized()) {
      mainWindow?.maximize();
    }
  });

  // Handle window close
  mainWindow.on('close', () => {
    if (mainWindow !== null) {
      saveWindowState(mainWindow);
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle new window requests (block popup windows)
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Handle navigation (block external navigation)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    const isAllowed =
      parsedUrl.protocol === 'file:' ||
      (isDevelopment && parsedUrl.origin === 'http://localhost:5173');

    if (!isAllowed) {
      event.preventDefault();
    }
  });
}

/**
 * Load the renderer (dev server or built files)
 */
function loadRenderer(): void {
  if (mainWindow === null) return;

  const devServerUrl = process.env['VITE_DEV_SERVER_URL'];

  if (isDevelopment && devServerUrl !== undefined && devServerUrl !== '') {
    // Load from Vite dev server in development
    mainWindow
      .loadURL(devServerUrl)
      .then(() => {
        // Open DevTools in development
        mainWindow?.webContents.openDevTools({ mode: 'right' });
      })
      .catch((error: unknown) => {
        console.error('Failed to load dev server:', error);
      });
  } else {
    // Load from built files in production
    const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
    console.log('Loading renderer from:', rendererPath);
    mainWindow
      .loadFile(rendererPath)
      .then(() => {
        // Open DevTools for debugging
        mainWindow?.webContents.openDevTools({ mode: 'right' });
      })
      .catch((error: unknown) => console.error('Failed to load renderer:', error));
  }
}

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  // Initialize app paths (creates directories)
  getAppPaths();

  // Initialize database
  await initializeDatabaseLayer();

  // Register IPC handlers
  console.log('Registering IPC handlers...');
  registerPlaceholderHandlers();
  console.log('IPC handlers registered');

  // Create application menu
  createApplicationMenu();

  // Create the main window
  createWindow();
}

// App lifecycle: Ready
void app.whenReady().then(async () => {
  try {
    // Set up CSP before window creation
    setupContentSecurityPolicy();

    await initializeApp();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
});

// App lifecycle: Activate (macOS)
app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow !== null) {
    mainWindow.show();
  }
});

// App lifecycle: All windows closed
app.on('window-all-closed', () => {
  // Save and close database before quitting
  closeDatabase();

  // Quit the app when all windows are closed
  app.quit();
});

// App lifecycle: Before quit
app.on('before-quit', () => {
  // Save window state before quitting
  if (mainWindow !== null) {
    saveWindowState(mainWindow);
  }
  // Close database
  closeDatabase();
});

// Security: Handle certificate errors
app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  // In production, always validate certificates
  // In development, you might want to allow self-signed certs
  event.preventDefault();
  callback(isDevelopment);
});

// Security: Disable navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  // Block all navigation to external URLs in the main window
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
