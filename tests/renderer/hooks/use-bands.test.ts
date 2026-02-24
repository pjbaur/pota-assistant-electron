import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDayBandForecast } from '../../helpers/fixtures';
import { setupMockElectronAPI } from '../../helpers/mock-ipc';
import { useBands } from '../../../src/renderer/hooks/use-bands';

describe('renderer/hooks/use-bands', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupMockElectronAPI();
  });

  it('fetches band recommendations for the provided date', async () => {
    const targetDate = new Date('2026-03-15T12:00:00Z');
    const forecast = createDayBandForecast();
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValueOnce({ success: true, data: forecast });

    const { result } = renderHook(() => useBands(targetDate));

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('bands:get:recommendations', {
        date: '2026-03-15',
      });
    });

    await waitFor(() => {
      expect(result.current.forecast).toEqual(forecast);
    });
    expect(result.current.error).toBeNull();
  });

  it('resets forecast without calling IPC when date is null', async () => {
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useBands(null));

    await waitFor(() => {
      expect(result.current.forecast).toBeNull();
    });

    expect(result.current.error).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('stores errors from failed responses', async () => {
    const targetDate = new Date('2026-03-15T12:00:00Z');
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    invoke.mockResolvedValue({
      success: false,
      error: 'Band prediction unavailable',
      errorCode: 'NETWORK_ERROR',
    });

    const { result } = renderHook(() => useBands(targetDate));

    await waitFor(() => {
      expect(result.current.error).toBe('Band prediction unavailable');
    });
  });

  it('supports manual refetch for updated forecasts', async () => {
    const targetDate = new Date('2026-03-15T12:00:00Z');
    const first = createDayBandForecast({ date: '2026-03-16' });
    const second = createDayBandForecast({ date: '2026-03-17' });
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    invoke.mockResolvedValueOnce({ success: true, data: first });

    const { result } = renderHook(() => useBands(targetDate));

    await waitFor(() => {
      expect(result.current.forecast?.date).toBe('2026-03-16');
    });

    invoke.mockResolvedValueOnce({ success: true, data: second });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.forecast?.date).toBe('2026-03-17');
    });
  });
});
