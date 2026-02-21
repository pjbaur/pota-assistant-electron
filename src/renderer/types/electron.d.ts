/**
 * Type declarations for the Electron API exposed via contextBridge
 */

import type { ElectronAPI } from '../../preload/index';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
