import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParkReference } from '../../../../src/shared/types/park';
import type { PlanId, PlanInput, TimeSlot } from '../../../../src/shared/types/plan';

const {
  executeAllMock,
  executeOneMock,
  executeRunMock,
  executeScalarMock,
  saveDatabaseMock,
  getParkIdMock,
  randomUUIDMock,
} = vi.hoisted(() => ({
  executeAllMock: vi.fn(),
  executeOneMock: vi.fn(),
  executeRunMock: vi.fn(),
  executeScalarMock: vi.fn(),
  saveDatabaseMock: vi.fn(),
  getParkIdMock: vi.fn(),
  randomUUIDMock: vi.fn(),
}));

vi.mock('../../../../src/main/database/connection', () => ({
  executeAll: executeAllMock,
  executeOne: executeOneMock,
  executeRun: executeRunMock,
  executeScalar: executeScalarMock,
  saveDatabase: saveDatabaseMock,
}));

vi.mock('../../../../src/main/data/repositories/park-repository', () => ({
  getParkId: getParkIdMock,
}));

vi.mock('crypto', () => ({
  randomUUID: randomUUIDMock,
}));

type PlanRepositoryModule = typeof import('../../../../src/main/data/repositories/plan-repository');

interface PlanRowWithReferenceFixture {
  id: number;
  plan_uuid: string;
  park_id: number;
  name: string;
  activation_date: string;
  start_time: string | null;
  end_time: string | null;
  equipment_preset_id: number | null;
  time_slots: string;
  operator_callsign: string | null;
  bands: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  park_reference: string;
}

function asParkReference(value: string): ParkReference {
  return value as ParkReference;
}

function asPlanId(value: string): PlanId {
  return value as PlanId;
}

function asIsoDate(value: string): PlanInput['activationDate'] {
  return value as PlanInput['activationDate'];
}

function createTimeSlots(): TimeSlot[] {
  return [
    { startTime: '08:00', endTime: '10:00', band: '20m', mode: 'SSB' },
    { startTime: '10:00', endTime: '12:00', band: '40m', mode: 'CW' },
  ];
}

function createPlanInputFixture(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    name: 'Weekend Activation',
    parkReference: asParkReference('K-0039'),
    activationDate: asIsoDate('2026-03-15'),
    startTime: '08:00',
    endTime: '12:00',
    equipmentPreset: {
      id: 'preset-1',
      name: 'QRP Portable',
      radio: 'FT-818',
      antenna: 'End-fed',
      powerWatts: 5,
      mode: 'SSB',
      notes: 'Light kit',
    },
    bands: ['20m', '40m'],
    timeSlots: createTimeSlots(),
    operatorCallsign: 'K1ABC',
    notes: 'Bring backup battery',
    ...overrides,
  };
}

function createPlanRow(overrides: Partial<PlanRowWithReferenceFixture> = {}): PlanRowWithReferenceFixture {
  return {
    id: 1,
    plan_uuid: '550e8400-e29b-41d4-a716-446655440000',
    park_id: 7,
    name: 'Weekend Activation',
    activation_date: '2026-03-15',
    start_time: '08:00',
    end_time: '12:00',
    equipment_preset_id: 1,
    time_slots: JSON.stringify(createTimeSlots()),
    operator_callsign: 'K1ABC',
    bands: '20m,40m',
    notes: 'Bring backup battery',
    created_at: '2026-03-01T09:00:00.000Z',
    updated_at: '2026-03-01T09:00:00.000Z',
    park_reference: 'K-0039',
    ...overrides,
  };
}

async function importPlanRepository(): Promise<PlanRepositoryModule> {
  return import('../../../../src/main/data/repositories/plan-repository');
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-03-01T12:00:00.000Z'));

  executeAllMock.mockReturnValue([]);
  executeOneMock.mockReturnValue(null);
  executeRunMock.mockReturnValue(1);
  executeScalarMock.mockReturnValue(0);
  saveDatabaseMock.mockReturnValue(undefined);
  getParkIdMock.mockReturnValue(7);
  randomUUIDMock.mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('main/data/repositories/plan-repository', () => {
  it('createPlan generates UUID, serializes slots, and saves plan', async () => {
    const input = createPlanInputFixture();
    executeScalarMock.mockReturnValue(3);

    const repository = await importPlanRepository();
    const result = repository.createPlan(input);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result?.createdAt).toBe('2026-03-01T12:00:00.000Z');
    expect(result?.updatedAt).toBe('2026-03-01T12:00:00.000Z');
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);

    const [insertSql, insertParamsRaw] = executeRunMock.mock.calls[0] as [string, unknown[]];
    const insertParams = insertParamsRaw ?? [];
    expect(insertSql).toContain('INSERT INTO plans');
    expect(insertParams[0]).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(insertParams[1]).toBe(7);
    expect(insertParams[7]).toBe(JSON.stringify(input.timeSlots));
    expect(insertParams[9]).toBe('20m,40m');
    expect(insertParams[10]).toBe('Bring backup battery');
  });

  it('createPlan returns null when park reference does not resolve', async () => {
    getParkIdMock.mockReturnValue(null);

    const repository = await importPlanRepository();
    const result = repository.createPlan(createPlanInputFixture());

    expect(result).toBeNull();
    expect(executeRunMock).not.toHaveBeenCalled();
    expect(saveDatabaseMock).not.toHaveBeenCalled();
  });

  it('createPlan stores null values for optional fields when omitted', async () => {
    const input = createPlanInputFixture({
      equipmentPreset: undefined,
      operatorCallsign: undefined,
      notes: undefined,
    });

    const repository = await importPlanRepository();
    repository.createPlan(input);

    const [, insertParamsRaw] = executeRunMock.mock.calls[0] as [string, unknown[]];
    const insertParams = insertParamsRaw ?? [];
    expect(executeScalarMock).not.toHaveBeenCalled();
    expect(insertParams[6]).toBeNull();
    expect(insertParams[8]).toBeNull();
    expect(insertParams[10]).toBeNull();
  });

  it('getPlanById returns joined plan with parsed JSON time slots', async () => {
    executeOneMock.mockReturnValue(createPlanRow());

    const repository = await importPlanRepository();
    const result = repository.getPlanById(asPlanId('550e8400-e29b-41d4-a716-446655440000'));

    expect(result).not.toBeNull();
    expect(result?.parkReference).toBe('K-0039');
    expect(result?.timeSlots).toEqual(createTimeSlots());
    expect(result?.startTime).toBe('08:00');
  });

  it('getPlanById returns empty timeSlots when JSON is malformed', async () => {
    executeOneMock.mockReturnValue(createPlanRow({ time_slots: '{invalid-json' }));

    const repository = await importPlanRepository();
    const result = repository.getPlanById(asPlanId('550e8400-e29b-41d4-a716-446655440000'));

    expect(result?.timeSlots).toEqual([]);
  });

  it('getPlanById returns null when plan does not exist', async () => {
    executeOneMock.mockReturnValue(null);

    const repository = await importPlanRepository();
    const result = repository.getPlanById(asPlanId('550e8400-e29b-41d4-a716-446655440099'));

    expect(result).toBeNull();
  });

  it('listPlans applies filters, pagination, and hasMore calculation', async () => {
    getParkIdMock.mockReturnValue(42);
    executeScalarMock.mockReturnValue(2);
    executeAllMock.mockReturnValue([
      createPlanRow({
        plan_uuid: '550e8400-e29b-41d4-a716-446655440111',
        park_reference: 'K-0039',
      }),
    ]);

    const repository = await importPlanRepository();
    const result = repository.listPlans({
      parkReference: asParkReference('K-0039'),
      dateFrom: asIsoDate('2026-03-01'),
      dateTo: asIsoDate('2026-03-31'),
      limit: 1,
      offset: 0,
    });

    expect(result.total).toBe(2);
    expect(result.plans).toHaveLength(1);
    expect(result.hasMore).toBe(true);

    const [countSql, countParamsRaw] = executeScalarMock.mock.calls[0] as [string, unknown[]];
    const countParams = countParamsRaw ?? [];
    expect(countSql).toContain('p.park_id = ?');
    expect(countSql).toContain('p.activation_date >= ?');
    expect(countSql).toContain('p.activation_date <= ?');
    expect(countParams.slice(0, 3)).toEqual([42, '2026-03-01', '2026-03-31']);

    const [listSql] = executeAllMock.mock.calls[0] as [string, unknown[]];
    expect(listSql).toContain('ORDER BY p.activation_date DESC');
    expect(getParkIdMock).toHaveBeenCalledWith('K-0039');
  });

  it('updatePlan updates requested fields, sets updated_at, and returns latest plan', async () => {
    executeOneMock
      .mockReturnValueOnce(createPlanRow())
      .mockReturnValueOnce(
        createPlanRow({
          name: 'Updated Plan Name',
          park_id: 11,
          park_reference: 'K-0040',
          updated_at: '2026-03-01T12:00:00.000Z',
        })
      );
    getParkIdMock.mockReturnValue(11);

    const repository = await importPlanRepository();
    const result = repository.updatePlan(asPlanId('550e8400-e29b-41d4-a716-446655440000'), {
      name: 'Updated Plan Name',
      parkReference: asParkReference('K-0040'),
    });

    const [updateSql, updateParamsRaw] = executeRunMock.mock.calls[0] as [string, unknown[]];
    const updateParams = updateParamsRaw ?? [];
    expect(updateSql).toContain('UPDATE plans SET');
    expect(updateSql).toContain('updated_at = ?');
    expect(updateSql).toContain('name = ?');
    expect(updateSql).toContain('park_id = ?');
    expect(updateSql).toContain('WHERE plan_uuid = ?');
    expect(updateParams).toEqual([
      '2026-03-01T12:00:00.000Z',
      'Updated Plan Name',
      11,
      '550e8400-e29b-41d4-a716-446655440000',
    ]);
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);
    expect(result?.name).toBe('Updated Plan Name');
    expect(result?.parkReference).toBe('K-0040');
  });

  it('updatePlan returns null when target plan does not exist', async () => {
    executeOneMock.mockReturnValue(null);

    const repository = await importPlanRepository();
    const result = repository.updatePlan(asPlanId('550e8400-e29b-41d4-a716-446655440099'), {
      name: 'Ignored',
    });

    expect(result).toBeNull();
    expect(executeRunMock).not.toHaveBeenCalled();
    expect(saveDatabaseMock).not.toHaveBeenCalled();
  });

  it('deletePlan returns true and saves when a row is removed', async () => {
    executeRunMock.mockReturnValue(1);

    const repository = await importPlanRepository();
    const deleted = repository.deletePlan(asPlanId('550e8400-e29b-41d4-a716-446655440000'));

    expect(deleted).toBe(true);
    expect(executeRunMock).toHaveBeenCalledWith('DELETE FROM plans WHERE plan_uuid = ?', [
      '550e8400-e29b-41d4-a716-446655440000',
    ]);
    expect(saveDatabaseMock).toHaveBeenCalledTimes(1);
  });

  it('deletePlan returns false and does not save when no rows are removed', async () => {
    executeRunMock.mockReturnValue(0);

    const repository = await importPlanRepository();
    const deleted = repository.deletePlan(asPlanId('550e8400-e29b-41d4-a716-446655440099'));

    expect(deleted).toBe(false);
    expect(saveDatabaseMock).not.toHaveBeenCalled();
  });

  it('getEquipmentPresets maps snake_case fields and fallback values', async () => {
    executeAllMock.mockReturnValue([
      {
        id: 1,
        name: 'Field Kit',
        radio: 'KX2',
        antenna: 'EFHW',
        power_watts: 10,
        notes: 'Primary kit',
        is_builtin: 1,
      },
      {
        id: 2,
        name: 'Fallback Kit',
        radio: null,
        antenna: null,
        power_watts: null,
        notes: null,
        is_builtin: 0,
      },
    ]);

    const repository = await importPlanRepository();
    const presets = repository.getEquipmentPresets();

    expect(presets).toEqual([
      {
        id: '1',
        name: 'Field Kit',
        radio: 'KX2',
        antenna: 'EFHW',
        powerWatts: 10,
        mode: 'SSB',
        notes: 'Primary kit',
      },
      {
        id: '2',
        name: 'Fallback Kit',
        radio: 'Various',
        antenna: 'Various',
        powerWatts: 10,
        mode: 'SSB',
        notes: undefined,
      },
    ]);
  });
});
