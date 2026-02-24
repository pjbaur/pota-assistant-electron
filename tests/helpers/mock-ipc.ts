import { IPC_CHANNELS, IPC_EVENT_CHANNELS } from '@shared/ipc/channels';
import { vi } from 'vitest';
import type { ElectronAPI } from '../../src/preload';

export function setupMockElectronAPI(): {
  invoke: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
} {
  const invoke = vi.fn().mockResolvedValue({ success: true, data: null });
  const on = vi.fn().mockImplementation(() => vi.fn());
  const off = vi.fn();

  const electronAPI: ElectronAPI = {
    invoke: invoke as unknown as ElectronAPI['invoke'],
    on: on as unknown as ElectronAPI['on'],
    off: off as unknown as ElectronAPI['off'],
    channels: IPC_CHANNELS,
    eventChannels: IPC_EVENT_CHANNELS,
  };

  if (typeof window === 'undefined') {
    throw new Error('setupMockElectronAPI requires a browser-like test environment');
  }

  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    writable: true,
    value: electronAPI,
  });

  return { invoke, on, off };
}
