import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWeatherData } from '../../helpers/fixtures';
import { setupMockElectronAPI } from '../../helpers/mock-ipc';
import { useWeather } from '../../../src/renderer/hooks/use-weather';

describe('renderer/hooks/use-weather', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupMockElectronAPI();
  });

  it('fetches weather data on mount when coordinates are provided', async () => {
    const weatherData = createWeatherData();
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValueOnce({ success: true, data: weatherData });

    const { result } = renderHook(() => useWeather(44.428, -110.5885));

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('weather:get', {
        latitude: 44.428,
        longitude: -110.5885,
      });
    });

    await waitFor(() => {
      expect(result.current.weatherData).toEqual(weatherData);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('skips IPC calls when coordinates are null', async () => {
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useWeather(null, null));

    await waitFor(() => {
      expect(result.current.weatherData).toBeNull();
    });

    expect(result.current.error).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('stores errors and supports manual refetch', async () => {
    const first = createWeatherData({ source: 'First source' });
    const second = createWeatherData({ source: 'Second source' });
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    invoke
      .mockResolvedValueOnce({
        success: false,
        error: 'Weather service unavailable',
        errorCode: 'NETWORK_ERROR',
      })
      .mockResolvedValueOnce({ success: true, data: first })
      .mockResolvedValueOnce({ success: true, data: second });

    const { result } = renderHook(() => useWeather(40, -105));

    await waitFor(() => {
      expect(result.current.error).toBe('Weather service unavailable');
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.weatherData?.source).toBe('First source');

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.weatherData?.source).toBe('Second source');
    expect(invoke).toHaveBeenCalledTimes(3);
  });
});
