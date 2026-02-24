import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserConfig } from '../../helpers/fixtures';
import { setupMockElectronAPI } from '../../helpers/mock-ipc';
import { useFirstRun } from '../../../src/renderer/hooks/use-first-run';

describe('renderer/hooks/use-first-run', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupMockElectronAPI();
  });

  it('short-circuits when onboarding is already complete', async () => {
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValueOnce({
      success: true,
      data: createUserConfig({ hasCompletedOnboarding: true }),
    });

    const { result } = renderHook(() => useFirstRun());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFirstRun).toBe(false);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('config:get', {});
  });

  it('marks first run when onboarding is incomplete and no parks exist', async () => {
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    invoke
      .mockResolvedValueOnce({
        success: true,
        data: createUserConfig({ hasCompletedOnboarding: false }),
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          parks: [],
          total: 0,
          hasMore: false,
        },
      });

    const { result } = renderHook(() => useFirstRun());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFirstRun).toBe(true);
    expect(invoke).toHaveBeenNthCalledWith(2, 'parks:search', {
      limit: 1,
      offset: 0,
    });
  });

  it('completes onboarding and persists the flag', async () => {
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    invoke
      .mockResolvedValueOnce({
        success: true,
        data: createUserConfig({ hasCompletedOnboarding: false }),
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          parks: [],
          total: 0,
          hasMore: false,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: createUserConfig({ hasCompletedOnboarding: true }),
      });

    const { result } = renderHook(() => useFirstRun());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFirstRun).toBe(true);

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(invoke).toHaveBeenLastCalledWith('config:set', {
      updates: { hasCompletedOnboarding: true },
    });
    expect(result.current.isFirstRun).toBe(false);
  });

  it('falls back to first run when the initial check fails', async () => {
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    invoke
      .mockResolvedValueOnce({
        success: false,
        error: 'config read failed',
        errorCode: 'INTERNAL_ERROR',
      })
      .mockResolvedValueOnce({
        success: false,
        error: 'parks lookup failed',
        errorCode: 'INTERNAL_ERROR',
      });

    const { result } = renderHook(() => useFirstRun());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFirstRun).toBe(true);
  });

  it('still exits onboarding locally if persistence fails', async () => {
    const invoke = window.electronAPI.invoke as ReturnType<typeof vi.fn>;

    invoke
      .mockResolvedValueOnce({
        success: true,
        data: createUserConfig({ hasCompletedOnboarding: false }),
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          parks: [],
          total: 0,
          hasMore: false,
        },
      })
      .mockResolvedValueOnce({
        success: false,
        error: 'config write failed',
        errorCode: 'INTERNAL_ERROR',
      });

    const { result } = renderHook(() => useFirstRun());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(result.current.isFirstRun).toBe(false);
  });
});
