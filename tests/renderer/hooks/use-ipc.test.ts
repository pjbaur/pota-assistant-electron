import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { IPC_EVENT_CHANNELS } from '../../../src/shared/ipc/channels';
import { setupMockElectronAPI } from '../../helpers/mock-ipc';
import { useIPC, useIPCListener } from '../../../src/renderer/hooks/use-ipc';

describe('renderer/hooks/use-ipc', () => {
  it('invokes IPC channels through the preload API', async () => {
    const { invoke } = setupMockElectronAPI();
    invoke.mockResolvedValueOnce({
      success: true,
      data: { plans: [], total: 0, hasMore: false },
    });

    const { result } = renderHook(() => useIPC());
    const response = await result.current.invoke('plans:list', {});

    expect(invoke).toHaveBeenCalledWith('plans:list', {});
    expect(response).toEqual({
      success: true,
      data: { plans: [], total: 0, hasMore: false },
    });
  });

  it('returns INTERNAL_ERROR responses when invoke throws', async () => {
    const { invoke } = setupMockElectronAPI();
    invoke.mockRejectedValueOnce(new Error('IPC failure'));

    const { result } = renderHook(() => useIPC());
    const response = await result.current.invoke('plans:list', {});

    expect(response).toEqual({
      success: false,
      error: 'IPC failure',
      errorCode: 'INTERNAL_ERROR',
    });
  });

  it('returns INTERNAL_ERROR responses when electronAPI is missing', async () => {
    Reflect.deleteProperty(window, 'electronAPI');

    const { result } = renderHook(() => useIPC());
    const response = await result.current.invoke('plans:list', {});

    expect(response).toEqual({
      success: false,
      error: 'Electron API not available',
      errorCode: 'INTERNAL_ERROR',
    });
  });

  it('subscribes and unsubscribes to IPC events', () => {
    const { on, off } = setupMockElectronAPI();
    const cleanup = vi.fn();
    on.mockReturnValueOnce(cleanup);

    const { result } = renderHook(() => useIPCListener());
    const callback = vi.fn();

    const unsubscribe = result.current.subscribe(IPC_EVENT_CHANNELS.CONFIG_CHANGED, callback);
    expect(on).toHaveBeenCalledWith(IPC_EVENT_CHANNELS.CONFIG_CHANGED, callback);

    unsubscribe();
    expect(cleanup).toHaveBeenCalledTimes(1);

    result.current.unsubscribe(IPC_EVENT_CHANNELS.CONFIG_CHANGED);
    expect(off).toHaveBeenCalledWith(IPC_EVENT_CHANNELS.CONFIG_CHANGED);
  });

  it('returns no-op listeners and warns when electronAPI is unavailable', () => {
    Reflect.deleteProperty(window, 'electronAPI');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => useIPCListener());
    const cleanup = result.current.subscribe(IPC_EVENT_CHANNELS.CONFIG_CHANGED, vi.fn());

    expect(typeof cleanup).toBe('function');
    cleanup();
    result.current.unsubscribe(IPC_EVENT_CHANNELS.CONFIG_CHANGED);

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
