/**
 * Native application menu
 * Provides File, Edit, View, and Help menus
 */

import { Menu, BrowserWindow, app, MenuItem, MenuItemConstructorOptions } from 'electron';

interface MenuActions {
  newPlan: () => void;
  exportPlan: () => void;
  openSettings: () => void;
  toggleSidebar: () => void;
  showAbout: () => void;
  showKeyboardShortcuts: () => void;
}

let menuActions: MenuActions | null = null;

/**
 * Set the menu action handlers
 * These are called from menu items and delegate to the renderer
 */
export function setMenuActions(actions: MenuActions): void {
  menuActions = actions;
}

/**
 * Send an IPC message to the focused window
 */
function sendToRenderer(channel: string, ...args: unknown[]): void {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow !== null && focusedWindow !== undefined) {
    focusedWindow.webContents.send(channel, ...args);
  }
}

/**
 * Create the application menu
 */
export function createApplicationMenu(): Menu {
  const isMac = process.platform === 'darwin';

  const template: (MenuItemConstructorOptions | MenuItem)[] = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: 'Preferences...',
                accelerator: 'Cmd+,',
                click: (): void => {
                  if (menuActions !== null) {
                    menuActions.openSettings();
                  } else {
                    sendToRenderer('menu:settings');
                  }
                },
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Plan',
          accelerator: 'CmdOrCtrl+N',
          click: (): void => {
            if (menuActions !== null) {
              menuActions.newPlan();
            } else {
              sendToRenderer('menu:new-plan');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Export...',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: (): void => {
            if (menuActions !== null) {
              menuActions.exportPlan();
            } else {
              sendToRenderer('menu:export');
            }
          },
        },
        ...(isMac ? [] : [{ type: 'separator' as const }, { role: 'close' as const }]),
        ...(isMac
          ? []
          : [
              { type: 'separator' as const },
              {
                label: 'Preferences...',
                accelerator: 'Ctrl+,',
                click: (): void => {
                  if (menuActions !== null) {
                    menuActions.openSettings();
                  } else {
                    sendToRenderer('menu:settings');
                  }
                },
              },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ]),
      ],
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', accelerator: 'CmdOrCtrl+Z' },
        { role: 'redo', accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y' },
        { type: 'separator' },
        { role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { role: 'paste', accelerator: 'CmdOrCtrl+V' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' as const },
              { role: 'delete' as const },
              { role: 'selectAll' as const, accelerator: 'Cmd+A' },
            ]
          : [
              { role: 'delete' as const },
              { type: 'separator' as const },
              { role: 'selectAll' as const, accelerator: 'Ctrl+A' },
            ]),
      ],
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: (): void => {
            if (menuActions !== null) {
              menuActions.toggleSidebar();
            } else {
              sendToRenderer('menu:toggle-sidebar');
            }
          },
        },
        { type: 'separator' },
        { role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
        { type: 'separator' },
        { role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
        { role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          role: 'toggleDevTools',
        },
      ],
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },

    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: (): void => {
            if (menuActions !== null) {
              menuActions.showKeyboardShortcuts();
            } else {
              sendToRenderer('menu:shortcuts');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Learn More About POTA',
          click: (): void => {
            void (async (): Promise<void> => {
              const { shell } = await import('electron');
              await shell.openExternal('https://pota.app');
            })();
          },
        },
        {
          label: 'Documentation',
          click: (): void => {
            void (async (): Promise<void> => {
              const { shell } = await import('electron');
              await shell.openExternal('https://docs.pota.app');
            })();
          },
        },
        ...(isMac
          ? []
          : [
              { type: 'separator' as const },
              {
                label: 'About',
                click: (): void => {
                  if (menuActions !== null) {
                    menuActions.showAbout();
                  } else {
                    sendToRenderer('menu:about');
                  }
                },
              },
            ]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}
