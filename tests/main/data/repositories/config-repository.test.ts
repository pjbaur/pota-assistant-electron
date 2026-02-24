import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigKey } from '../../../../src/shared/types/config';
import { DEFAULT_CONFIG } from '../../../../src/shared/types/config';

const { executeAllMock, executeOneMock, executeRunMock, saveDatabaseMock } = vi.hoisted(() => ({
  executeAllMock: vi.fn(),
  executeOneMock: vi.fn(),
  executeRunMock: vi.fn(),
  saveDatabaseMock: vi.fn(),
}));

vi.mock('../../../../src/main/database/connection', () => ({
  executeAll: executeAllMock,
  executeOne: executeOneMock,
  executeRun: executeRunMock,
  saveDatabase: saveDatabaseMock,
}));

type ConfigRepositoryModule = typeof import('../../../../src/main/data/repositories/config-repository');

async function importConfigRepository(): Promise<ConfigRepositoryModule> {
  return import('../../../../src/main/data/repositories/config-repository');
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  executeAllMock.mockReturnValue([]);
  executeOneMock.mockReturnValue(null);
  executeRunMock.mockReturnValue(1);
  saveDatabaseMock.mockReturnValue(undefined);
});

describe('main/data/repositories/config-repository', () => {
  it('getConfigValue returns stored string and default fallback when key is missing', async () => {
    executeOneMock.mockReturnValueOnce({ value: 'W1AW' }).mockReturnValueOnce(null);

    const repository = await importConfigRepository();

    expect(repository.getConfigValue('callsign')).toBe('W1AW');
    expect(repository.getConfigValue('theme')).toBe(DEFAULT_CONFIG.theme);
  });

  it('getConfigValue parses number, boolean, JSON object/array, and float values', async () => {
    executeOneMock
      .mockReturnValueOnce({ value: '10' })
      .mockReturnValueOnce({ value: 'true' })
      .mockReturnValueOnce({
        value: JSON.stringify([
          {
            id: 'preset-1',
            name: 'QRP',
            radio: 'FT-818',
            antenna: 'EFHW',
            powerWatts: 5,
            mode: 'SSB',
          },
        ]),
      })
      .mockReturnValueOnce({
        value: JSON.stringify({
          x: 50,
          y: 60,
          width: 1200,
          height: 900,
          isMaximized: false,
        }),
      })
      .mockReturnValueOnce({ value: '39.7392' });

    const repository = await importConfigRepository();

    expect(repository.getConfigValue('defaultMapZoom')).toBe(10);
    expect(repository.getConfigValue('showOfflineIndicator')).toBe(true);
    expect(repository.getConfigValue('equipmentPresets')).toEqual([
      {
        id: 'preset-1',
        name: 'QRP',
        radio: 'FT-818',
        antenna: 'EFHW',
        powerWatts: 5,
        mode: 'SSB',
      },
    ]);
    expect(repository.getConfigValue('windowBounds')).toEqual({
      x: 50,
      y: 60,
      width: 1200,
      height: 900,
      isMaximized: false,
    });
    expect(repository.getConfigValue('defaultLatitude')).toBe(39.7392);
  });

  it('getConfigValue returns undefined for unknown keys and default on JSON parse failure', async () => {
    executeOneMock
      .mockReturnValueOnce({ value: 'anything' })
      .mockReturnValueOnce({ value: '{bad-json' });

    const repository = await importConfigRepository();
    const unknown = repository.getConfigValue('unknownKey' as ConfigKey);
    const fallback = repository.getConfigValue('equipmentPresets');

    expect(unknown).toBeUndefined();
    expect(fallback).toEqual(DEFAULT_CONFIG.equipmentPresets);
  });

  it('setConfigValue serializes primitives and objects then saves', async () => {
    const repository = await importConfigRepository();

    repository.setConfigValue('callsign', 'W1AW');
    repository.setConfigValue('defaultMapZoom', 10);
    repository.setConfigValue('showOfflineIndicator', true);
    repository.setConfigValue('windowBounds', {
      x: 0,
      y: 0,
      width: 1000,
      height: 700,
      isMaximized: false,
    });

    expect(executeRunMock).toHaveBeenCalledTimes(4);
    expect(executeRunMock.mock.calls[0]?.[1]).toEqual(['callsign', 'W1AW']);
    expect(executeRunMock.mock.calls[1]?.[1]).toEqual(['defaultMapZoom', '10']);
    expect(executeRunMock.mock.calls[2]?.[1]).toEqual(['showOfflineIndicator', 'true']);
    expect(executeRunMock.mock.calls[3]?.[1]).toEqual([
      'windowBounds',
      JSON.stringify({
        x: 0,
        y: 0,
        width: 1000,
        height: 700,
        isMaximized: false,
      }),
    ]);
    expect(saveDatabaseMock).toHaveBeenCalledTimes(4);
    expect(executeRunMock.mock.calls[0]?.[0]).toContain('INSERT OR REPLACE INTO user_config');
  });

  it('setConfigValues updates multiple keys, skips undefined, and saves once', async () => {
    const repository = await importConfigRepository();

    repository.setConfigValues({
      theme: 'dark',
      defaultMapZoom: 9,
      callsign: undefined,
    });

    expect(executeRunMock).toHaveBeenCalledTimes(2);
    expect(executeRunMock.mock.calls[0]?.[1]).toEqual(['theme', 'dark']);
    expect(executeRunMock.mock.calls[1]?.[1]).toEqual(['defaultMapZoom', '9']);
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);
  });

  it('setConfigValues does not write when all update values are undefined', async () => {
    const repository = await importConfigRepository();

    repository.setConfigValues({
      callsign: undefined,
      homeGridSquare: undefined,
      windowBounds: undefined,
    });

    expect(executeRunMock).not.toHaveBeenCalled();
    expect(saveDatabaseMock).not.toHaveBeenCalled();
  });

  it('initializeConfigDefaults leaves storage unchanged when defaults are already represented', async () => {
    executeAllMock.mockReturnValue([]);

    const repository = await importConfigRepository();
    repository.initializeConfigDefaults();

    expect(executeRunMock).not.toHaveBeenCalled();
    expect(saveDatabaseMock).not.toHaveBeenCalled();
  });

  it('getAllConfig merges stored values and ignores unsupported keys', async () => {
    executeAllMock.mockReturnValue([
      { key: 'theme', value: 'dark' },
      { key: 'defaultMapZoom', value: '12' },
      { key: 'unknown_key', value: 'x' },
    ]);

    const repository = await importConfigRepository();
    const config = repository.getAllConfig();

    expect(config.theme).toBe('dark');
    expect(config.defaultMapZoom).toBe(12);
    expect(config.distanceUnit).toBe(DEFAULT_CONFIG.distanceUnit);
  });
});
