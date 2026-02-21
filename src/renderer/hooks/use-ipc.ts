import { useCallback, useRef } from 'react';
import type {
  IpcChannel,
  IpcRequest,
  IpcResponse,
  IpcResponseData,
} from '@shared/types';
import type { IpcEventChannelName } from '@shared/ipc/channels';

export interface IPCResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export interface UseIPCOptions {
  onError?: (error: Error) => void;
  onSuccess?: (data: unknown) => void;
}

/**
 * Hook for type-safe IPC communication with the main process.
 */
export function useIPC(): {
  invoke: <C extends IpcChannel>(
    channel: C,
    params: IpcRequest<C>
  ) => Promise<IpcResponse<IpcResponseData<C>>>;
  isLoading: boolean;
  error: Error | null;
} {
  const isLoadingRef = useRef(false);
  const errorRef = useRef<Error | null>(null);

  const invoke = useCallback(
    async <C extends IpcChannel>(
      channel: C,
      params: IpcRequest<C>
    ): Promise<IpcResponse<IpcResponseData<C>>> => {
      if (typeof window.electronAPI === 'undefined') {
        const invokeError = new Error('Electron API not available');
        errorRef.current = invokeError;
        return {
          success: false,
          error: invokeError.message,
          errorCode: 'INTERNAL_ERROR',
        };
      }

      isLoadingRef.current = true;
      errorRef.current = null;

      try {
        const result = await window.electronAPI.invoke(channel, params);
        isLoadingRef.current = false;
        return result;
      } catch (err) {
        const invokeError = err instanceof Error ? err : new Error(String(err));
        isLoadingRef.current = false;
        errorRef.current = invokeError;
        return {
          success: false,
          error: invokeError.message,
          errorCode: 'INTERNAL_ERROR',
        };
      }
    },
    []
  );

  return {
    invoke,
    isLoading: isLoadingRef.current,
    error: errorRef.current,
  };
}

/**
 * Hook for subscribing to IPC events from the main process.
 */
export function useIPCListener(): {
  subscribe: <T = unknown>(
    channel: IpcEventChannelName,
    callback: (data: T) => void
  ) => () => void;
  unsubscribe: (channel: IpcEventChannelName) => void;
} {
  const subscribe = useCallback(
    <T = unknown>(
      channel: IpcEventChannelName,
      callback: (data: T) => void
    ): (() => void) => {
      if (typeof window.electronAPI === 'undefined') {
        console.warn('Electron API not available');
        return () => {
          /* no-op */
        };
      }

      return window.electronAPI.on(channel, callback);
    },
    []
  );

  const unsubscribe = useCallback((channel: IpcEventChannelName): void => {
    if (typeof window.electronAPI === 'undefined') {
      console.warn('Electron API not available');
      return;
    }

    window.electronAPI.off(channel);
  }, []);

  return { subscribe, unsubscribe };
}
