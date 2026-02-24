import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const mocks = vi.hoisted(() => {
  const registeredHandlers = new Map<string, (event: unknown, params: unknown) => Promise<unknown>>();

  const ipcHandleMock = vi.fn((channel: string, handler: (event: unknown, params: unknown) => Promise<unknown>) => {
    registeredHandlers.set(channel, handler);
  });
  const ipcRemoveHandlerMock = vi.fn((channel: string) => {
    registeredHandlers.delete(channel);
  });

  return {
    registeredHandlers,
    ipcHandleMock,
    ipcRemoveHandlerMock,
    getAllWindowsMock: vi.fn(() => [] as Array<{ webContents: { send: ReturnType<typeof vi.fn> } }>),
    fromIdMock: vi.fn(() => null),
    showOpenDialogMock: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] as string[] }),
    openExternalMock: vi.fn().mockResolvedValue(undefined),

    searchParksMock: vi.fn(),
    getParkByReferenceMock: vi.fn(),
    toggleFavoriteMock: vi.fn(),
    insertParkMock: vi.fn(),

    createPlanMock: vi.fn(),
    getPlanByIdMock: vi.fn(),
    listPlansMock: vi.fn(),
    updatePlanMock: vi.fn(),
    deletePlanMock: vi.fn(),

    getConfigValueMock: vi.fn(),
    getAllConfigMock: vi.fn(),
    setConfigValuesMock: vi.fn(),

    importParksFromCsvMock: vi.fn(),
    getBandRecommendationsMock: vi.fn(),

    exportPlanAsyncMock: vi.fn(),
    isFormatSupportedMock: vi.fn(),

    recordImportMetadataMock: vi.fn(),
    getWeatherMock: vi.fn(),
  };
});

vi.mock('electron', () => ({
  ipcMain: {
    handle: mocks.ipcHandleMock,
    removeHandler: mocks.ipcRemoveHandlerMock,
  },
  BrowserWindow: {
    getAllWindows: mocks.getAllWindowsMock,
    fromId: mocks.fromIdMock,
  },
  dialog: {
    showOpenDialog: mocks.showOpenDialogMock,
  },
  shell: {
    openExternal: mocks.openExternalMock,
  },
}));

vi.mock('../../../src/main/data/repositories/park-repository', () => ({
  searchParks: mocks.searchParksMock,
  getParkByReference: mocks.getParkByReferenceMock,
  toggleFavorite: mocks.toggleFavoriteMock,
  insertPark: mocks.insertParkMock,
}));

vi.mock('../../../src/main/data/repositories/plan-repository', () => ({
  createPlan: mocks.createPlanMock,
  getPlanById: mocks.getPlanByIdMock,
  listPlans: mocks.listPlansMock,
  updatePlan: mocks.updatePlanMock,
  deletePlan: mocks.deletePlanMock,
}));

vi.mock('../../../src/main/data/repositories/config-repository', () => ({
  getConfigValue: mocks.getConfigValueMock,
  getAllConfig: mocks.getAllConfigMock,
  setConfigValues: mocks.setConfigValuesMock,
}));

vi.mock('../../../src/main/services/csv-import-service', () => ({
  importParksFromCsv: mocks.importParksFromCsvMock,
}));

vi.mock('../../../src/main/services/band-service', () => ({
  getBandRecommendations: mocks.getBandRecommendationsMock,
}));

vi.mock('../../../src/main/services/export-service', () => ({
  exportPlanAsync: mocks.exportPlanAsyncMock,
  isFormatSupported: mocks.isFormatSupportedMock,
}));

vi.mock('../../../src/main/database/connection', () => ({
  recordImportMetadata: mocks.recordImportMetadataMock,
}));

vi.mock('../../../src/main/services/weather-service', () => ({
  getWeather: mocks.getWeatherMock,
}));

import {
  IPC_CHANNELS,
  IPC_EVENT_CHANNELS,
  type IpcChannelName,
} from '../../../src/shared/ipc/channels';
import {
  registerAppHandlers,
  registerHandler,
  unregisterAllHandlers,
} from '../../../src/main/ipc/handlers';
import { createDayBandForecast, createPark, createPlan, createPlanInput, createUserConfig, createWeatherData } from '../../helpers/fixtures';

async function invokeChannel(channel: IpcChannelName, params?: unknown) {
  const handler = mocks.registeredHandlers.get(channel);
  expect(handler).toBeDefined();
  return handler?.({}, params);
}

describe('main/ipc/handlers', () => {
  beforeEach(() => {
    unregisterAllHandlers();
    mocks.registeredHandlers.clear();
    vi.clearAllMocks();

    mocks.getAllWindowsMock.mockReturnValue([]);
    mocks.fromIdMock.mockReturnValue(null);
    mocks.showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] });
    mocks.openExternalMock.mockResolvedValue(undefined);

    mocks.searchParksMock.mockReturnValue({ parks: [], total: 0, hasMore: false });
    mocks.getParkByReferenceMock.mockReturnValue(null);
    mocks.toggleFavoriteMock.mockReturnValue(null);

    const plan = createPlan();
    mocks.createPlanMock.mockReturnValue(plan);
    mocks.getPlanByIdMock.mockReturnValue(plan);
    mocks.listPlansMock.mockReturnValue({ plans: [plan], total: 1, hasMore: false });
    mocks.updatePlanMock.mockReturnValue(plan);
    mocks.deletePlanMock.mockReturnValue(true);

    mocks.getAllConfigMock.mockReturnValue(createUserConfig());
    mocks.getConfigValueMock.mockReturnValue('K1ABC');

    mocks.isFormatSupportedMock.mockReturnValue(true);
    mocks.exportPlanAsyncMock.mockResolvedValue({
      content: 'data',
      format: 'json',
      filename: 'plan.json',
    });

    mocks.getWeatherMock.mockResolvedValue(createWeatherData());
    mocks.getBandRecommendationsMock.mockReturnValue(createDayBandForecast());

    mocks.importParksFromCsvMock.mockResolvedValue({
      parks: [],
      errors: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      imported: 0,
      skipped: 0,
    });
  });

  describe('handler registration framework', () => {
    it('registerHandler registers with ipcMain.handle', () => {
      const handler = vi.fn().mockReturnValue({ success: true, data: 'ok' });

      registerHandler({
        channel: IPC_CHANNELS.PARKS_SEARCH,
        handler,
      });

      expect(mocks.ipcHandleMock).toHaveBeenCalledWith(IPC_CHANNELS.PARKS_SEARCH, expect.any(Function));
    });

    it('warns on duplicate registration and ignores second registration', () => {
      const warningSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      registerHandler({
        channel: IPC_CHANNELS.PARKS_GET,
        handler: () => ({ success: true, data: {} }),
      });
      registerHandler({
        channel: IPC_CHANNELS.PARKS_GET,
        handler: () => ({ success: true, data: {} }),
      });

      expect(warningSpy).toHaveBeenCalledWith(
        `IPC handler already registered for channel: ${IPC_CHANNELS.PARKS_GET}`
      );
      expect(mocks.ipcHandleMock).toHaveBeenCalledTimes(1);
    });

    it('unregisterAllHandlers removes each registered channel', () => {
      registerAppHandlers();
      expect(mocks.registeredHandlers.size).toBe(Object.values(IPC_CHANNELS).length);

      unregisterAllHandlers();

      expect(mocks.ipcRemoveHandlerMock).toHaveBeenCalledTimes(Object.values(IPC_CHANNELS).length);
      expect(mocks.registeredHandlers.size).toBe(0);
    });

    it('returns VALIDATION_ERROR for invalid schema input and passes valid input', async () => {
      const handler = vi.fn().mockReturnValue({ success: true, data: { echoed: true } });

      registerHandler({
        channel: IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL,
        requestSchema: z.object({ value: z.number() }),
        handler,
      });

      const invalid = await invokeChannel(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, { value: 'nope' });
      expect(invalid).toMatchObject({ success: false, errorCode: 'VALIDATION_ERROR' });
      expect(handler).not.toHaveBeenCalled();

      const valid = await invokeChannel(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, { value: 1 });
      expect(valid).toMatchObject({ success: true, data: { echoed: true } });
      expect(handler).toHaveBeenCalledWith({ value: 1 });
    });

    it('wraps uncaught exceptions as INTERNAL_ERROR responses', async () => {
      registerHandler({
        channel: IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL,
        handler: () => {
          throw new Error('boom');
        },
      });

      const response = await invokeChannel(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, {});
      expect(response).toMatchObject({
        success: false,
        errorCode: 'INTERNAL_ERROR',
      });
      expect((response as { error?: string }).error).toContain('boom');
    });
  });

  describe('app handlers', () => {
    it('handles park search/get/toggle success and not-found flows', async () => {
      registerAppHandlers();

      const park = createPark();
      mocks.searchParksMock.mockReturnValue({ parks: [park], total: 1, hasMore: false });
      mocks.getParkByReferenceMock.mockReturnValueOnce(park).mockReturnValueOnce(null);
      mocks.toggleFavoriteMock
        .mockReturnValueOnce({ reference: park.reference, isFavorite: true })
        .mockReturnValueOnce(null);

      const search = await invokeChannel(IPC_CHANNELS.PARKS_SEARCH, { query: 'Yellow' });
      const getSuccess = await invokeChannel(IPC_CHANNELS.PARKS_GET, { reference: park.reference });
      const getMissing = await invokeChannel(IPC_CHANNELS.PARKS_GET, { reference: park.reference });
      const toggleSuccess = await invokeChannel(IPC_CHANNELS.PARKS_TOGGLE_FAVORITE, { reference: park.reference });
      const toggleMissing = await invokeChannel(IPC_CHANNELS.PARKS_TOGGLE_FAVORITE, { reference: park.reference });

      expect(search).toMatchObject({ success: true, data: { total: 1 } });
      expect(getSuccess).toMatchObject({ success: true, data: park });
      expect(getMissing).toMatchObject({ success: false, errorCode: 'NOT_FOUND' });
      expect(toggleSuccess).toMatchObject({ success: true, data: { isFavorite: true } });
      expect(toggleMissing).toMatchObject({ success: false, errorCode: 'NOT_FOUND' });
    });

    it('handles plan create/get/list/update/delete and export flows', async () => {
      registerAppHandlers();

      const plan = createPlan();
      mocks.createPlanMock.mockReturnValueOnce(plan).mockReturnValueOnce(null);
      mocks.getPlanByIdMock.mockReturnValueOnce(plan).mockReturnValueOnce(null).mockReturnValueOnce(plan);
      mocks.updatePlanMock.mockReturnValueOnce(plan).mockReturnValueOnce(null);
      mocks.deletePlanMock.mockReturnValueOnce(true).mockReturnValueOnce(false);
      mocks.isFormatSupportedMock.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const createSuccess = await invokeChannel(IPC_CHANNELS.PLANS_CREATE, createPlanInput());
      const createMissing = await invokeChannel(IPC_CHANNELS.PLANS_CREATE, createPlanInput());
      const getSuccess = await invokeChannel(IPC_CHANNELS.PLANS_GET, { id: plan.id });
      const getMissing = await invokeChannel(IPC_CHANNELS.PLANS_GET, { id: plan.id });
      const list = await invokeChannel(IPC_CHANNELS.PLANS_LIST, {});
      const updateSuccess = await invokeChannel(IPC_CHANNELS.PLANS_UPDATE, { id: plan.id, updates: { name: 'Updated' } });
      const updateMissing = await invokeChannel(IPC_CHANNELS.PLANS_UPDATE, { id: plan.id, updates: { name: 'Updated Again' } });
      const deleteSuccess = await invokeChannel(IPC_CHANNELS.PLANS_DELETE, { id: plan.id });
      const deleteMissing = await invokeChannel(IPC_CHANNELS.PLANS_DELETE, { id: plan.id });
      const exportSuccess = await invokeChannel(IPC_CHANNELS.PLANS_EXPORT, { id: plan.id, format: 'json' });
      const exportBadFormat = await invokeChannel(IPC_CHANNELS.PLANS_EXPORT, { id: plan.id, format: 'xml' });

      expect(createSuccess).toMatchObject({ success: true, data: plan });
      expect(createMissing).toMatchObject({ success: false, errorCode: 'NOT_FOUND' });
      expect(getSuccess).toMatchObject({ success: true, data: plan });
      expect(getMissing).toMatchObject({ success: false, errorCode: 'NOT_FOUND' });
      expect(list).toMatchObject({ success: true, data: { total: 1 } });
      expect(updateSuccess).toMatchObject({ success: true, data: plan });
      expect(updateMissing).toMatchObject({ success: false, errorCode: 'NOT_FOUND' });
      expect(deleteSuccess).toMatchObject({ success: true, data: { deleted: true } });
      expect(deleteMissing).toMatchObject({ success: false, errorCode: 'NOT_FOUND' });
      expect(exportSuccess).toMatchObject({ success: true, data: { filename: 'plan.json' } });
      expect(exportBadFormat).toMatchObject({ success: false, errorCode: 'VALIDATION_ERROR' });
    });

    it('handles weather and band recommendation success and errors', async () => {
      registerAppHandlers();

      const weather = createWeatherData();
      mocks.getWeatherMock.mockResolvedValueOnce(weather).mockResolvedValueOnce(null);
      mocks.getBandRecommendationsMock.mockReturnValue(createDayBandForecast());

      const weatherSuccess = await invokeChannel(IPC_CHANNELS.WEATHER_GET, { latitude: 39.7, longitude: -104.9 });
      const weatherInvalid = await invokeChannel(IPC_CHANNELS.WEATHER_GET, { latitude: 'bad', longitude: -104.9 });
      const weatherError = await invokeChannel(IPC_CHANNELS.WEATHER_GET, { latitude: 39.7, longitude: -104.9 });
      const bandSuccess = await invokeChannel(IPC_CHANNELS.BANDS_GET_RECOMMENDATIONS, { date: '2026-03-15' });
      const bandInvalid = await invokeChannel(IPC_CHANNELS.BANDS_GET_RECOMMENDATIONS, { date: 'not-a-date' });

      expect(weatherSuccess).toMatchObject({ success: true, data: weather });
      expect(weatherInvalid).toMatchObject({ success: false, errorCode: 'VALIDATION_ERROR' });
      expect(weatherError).toMatchObject({ success: false, errorCode: 'INTERNAL_ERROR' });
      expect(bandSuccess).toMatchObject({ success: true, data: { recommendations: expect.any(Array) } });
      expect(bandInvalid).toMatchObject({ success: false, errorCode: 'VALIDATION_ERROR' });
    });

    it('handles config channels and broadcasts config updates', async () => {
      registerAppHandlers();

      const sendMock = vi.fn();
      mocks.getAllWindowsMock.mockReturnValue([{ webContents: { send: sendMock } }]);
      const config = createUserConfig();

      mocks.getAllConfigMock.mockReturnValue(config);
      mocks.getConfigValueMock.mockReturnValue('K1ABC');

      const full = await invokeChannel(IPC_CHANNELS.CONFIG_GET, {});
      const single = await invokeChannel(IPC_CHANNELS.CONFIG_GET, { key: 'callsign' });
      const set = await invokeChannel(IPC_CHANNELS.CONFIG_SET, { updates: { callsign: 'K1XYZ' } });

      expect(full).toMatchObject({ success: true, data: config });
      expect(single).toMatchObject({ success: true, data: { callsign: 'K1ABC' } });
      expect(set).toMatchObject({ success: true, data: { updated: true } });
      expect(mocks.setConfigValuesMock).toHaveBeenCalledWith({ callsign: 'K1XYZ' });
      expect(sendMock).toHaveBeenCalledWith('event:config:changed', { callsign: 'K1XYZ' });
    });

    it('handles system channels for CSV selection and external URL opening', async () => {
      registerAppHandlers();

      mocks.showOpenDialogMock.mockResolvedValueOnce({ canceled: false, filePaths: ['/tmp/parks.csv'] });
      mocks.openExternalMock.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('launch failed'));

      const selected = await invokeChannel(IPC_CHANNELS.SYSTEM_SELECT_CSV);
      const openSuccess = await invokeChannel(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, { url: 'https://example.com' });
      const openError = await invokeChannel(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, { url: 'https://example.com' });

      expect(selected).toMatchObject({ success: true, data: { canceled: false, filePath: '/tmp/parks.csv' } });
      expect(openSuccess).toMatchObject({ success: true, data: { opened: true } });
      expect(openError).toMatchObject({ success: false, errorCode: 'INTERNAL_ERROR' });
    });

    it('handles CSV import success and broadcasts progress events', async () => {
      registerAppHandlers();

      const sendA = vi.fn();
      const sendB = vi.fn();
      mocks.getAllWindowsMock.mockReturnValue([
        { webContents: { send: sendA } },
        { webContents: { send: sendB } },
      ]);

      mocks.importParksFromCsvMock.mockImplementation(async (_filePath, insertBatch, onProgress) => {
        const parsedParks = [
          {
            reference: 'K-0039',
            name: 'Yellowstone National Park',
            latitude: 44.428,
            longitude: -110.5885,
            grid_square: 'DN44',
            state: 'Wyoming',
            country: 'US',
            entity_id: 291,
            location_desc: 'Wyoming, US',
            is_active: 1,
            is_favorite: 0,
          },
        ];

        onProgress({
          phase: 'importing',
          recordsProcessed: 1,
          totalRecords: 1,
          message: 'Importing...',
        });

        const imported = insertBatch(parsedParks);

        return {
          parks: parsedParks,
          errors: [
            {
              lineNumber: 5,
              row: {
                reference: 'INVALID',
                name: 'Bad Park',
                active: '1',
                entityId: '291',
                locationDesc: 'Nowhere, US',
                latitude: '999',
                longitude: '-110',
                grid: 'BAD',
              },
              errors: ['Invalid park reference format: INVALID'],
            },
          ],
          totalRows: 2,
          validRows: 1,
          invalidRows: 1,
          imported,
          skipped: 1,
        };
      });

      const response = await invokeChannel(IPC_CHANNELS.PARKS_IMPORT_CSV, { filePath: '/tmp/data/parks.csv' });

      expect(response).toMatchObject({
        success: true,
        data: {
          imported: 1,
          skipped: 1,
          totalRows: 2,
          validRows: 1,
          invalidRows: 1,
        },
      });
      expect(mocks.insertParkMock).toHaveBeenCalledTimes(1);
      expect(mocks.recordImportMetadataMock).toHaveBeenCalledWith('parks.csv', 1);
      expect(sendA).toHaveBeenCalledWith(
        IPC_EVENT_CHANNELS.PARKS_IMPORT_PROGRESS,
        expect.objectContaining({ phase: 'importing' })
      );
      expect(sendB).toHaveBeenCalledWith(
        IPC_EVENT_CHANNELS.PARKS_IMPORT_PROGRESS,
        expect.objectContaining({ phase: 'importing' })
      );
    });

    it('returns IMPORT_IN_PROGRESS when a CSV import is already running', async () => {
      registerAppHandlers();

      let resolveImport: ((value: {
        parks: never[];
        errors: never[];
        totalRows: number;
        validRows: number;
        invalidRows: number;
        imported: number;
        skipped: number;
      }) => void) | null = null;

      mocks.importParksFromCsvMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveImport = resolve;
          })
      );

      const firstImport = invokeChannel(IPC_CHANNELS.PARKS_IMPORT_CSV, { filePath: '/tmp/parks.csv' });
      await Promise.resolve();

      const secondImport = await invokeChannel(IPC_CHANNELS.PARKS_IMPORT_CSV, { filePath: '/tmp/parks.csv' });
      expect(secondImport).toMatchObject({ success: false, errorCode: 'IMPORT_IN_PROGRESS' });

      resolveImport?.({
        parks: [],
        errors: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        imported: 0,
        skipped: 0,
      });
      await firstImport;
    });

    it('returns FILE_ERROR when CSV import throws and surfaces error status', async () => {
      registerAppHandlers();

      mocks.importParksFromCsvMock.mockRejectedValue(new Error('broken CSV'));

      const response = await invokeChannel(IPC_CHANNELS.PARKS_IMPORT_CSV, { filePath: '/tmp/parks.csv' });
      expect(response).toMatchObject({ success: false, errorCode: 'FILE_ERROR' });

      const status = await invokeChannel(IPC_CHANNELS.PARKS_GET_IMPORT_STATUS);
      expect(status).toMatchObject({
        success: true,
        data: expect.objectContaining({ phase: 'error', isImporting: false }),
      });
    });
  });
});
