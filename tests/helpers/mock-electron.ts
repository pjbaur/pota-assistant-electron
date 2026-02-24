import { vi } from 'vitest';

export const mockElectron = {
  app: {
    getPath: vi.fn(() => '/tmp/test-userdata'),
    on: vi.fn(),
    whenReady: vi.fn().mockResolvedValue(undefined),
    isPackaged: false,
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
    fromId: vi.fn(() => null),
  },
  dialog: {
    showOpenDialog: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
  },
  shell: {
    openExternal: vi.fn().mockResolvedValue(undefined),
  },
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
};
