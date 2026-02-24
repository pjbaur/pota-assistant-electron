import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import {
  configSetParamsSchema,
  exportFormatSchema,
  ipcResponseSchema,
  openExternalParamsSchema,
  parkReferenceSchema,
  parkSearchParamsSchema,
  planIdSchema,
  planInputSchema,
  weatherRequestParamsSchema,
} from '../../../src/shared/ipc/schemas';

describe('parkSearchParamsSchema', () => {
  it('accepts valid search params', () => {
    const result = parkSearchParamsSchema.safeParse({
      query: 'Yellowstone',
      limit: 20,
    });

    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = parkSearchParamsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects limit of 0', () => {
    const result = parkSearchParamsSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit over 1000', () => {
    const result = parkSearchParamsSchema.safeParse({ limit: 1001 });
    expect(result.success).toBe(false);
  });

  it('rejects negative offset', () => {
    const result = parkSearchParamsSchema.safeParse({ offset: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects 3-character entityId', () => {
    const result = parkSearchParamsSchema.safeParse({ entityId: 'USA' });
    expect(result.success).toBe(false);
  });

  it('accepts valid bounds', () => {
    const result = parkSearchParamsSchema.safeParse({
      bounds: {
        minLat: 39,
        maxLat: 41,
        minLon: -106,
        maxLon: -104,
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects bounds with latitude above 90', () => {
    const result = parkSearchParamsSchema.safeParse({
      bounds: {
        minLat: 91,
        maxLat: 41,
        minLon: -106,
        maxLon: -104,
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('parkReferenceSchema', () => {
  it('accepts K-0039', () => {
    const result = parkReferenceSchema.safeParse('K-0039');
    expect(result.success).toBe(true);
  });

  it.each(['k-0039', 'K0039', 'ABCD-0039'])(
    'rejects invalid reference: %s',
    (value) => {
      const result = parkReferenceSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  );
});

describe('planInputSchema', () => {
  const validPlan = {
    name: 'Test',
    parkReference: 'K-0039',
    activationDate: '2026-01-01T00:00:00Z',
    startTime: '14:00',
    endTime: '16:00',
    equipmentPreset: {
      id: 'preset-1',
      name: 'Field Setup',
      radio: 'KX2',
      antenna: 'EFHW',
      powerWatts: 10,
      mode: 'SSB',
    },
    timeSlots: [
      {
        startTime: '14:00',
        endTime: '15:00',
        band: '20m',
        mode: 'SSB',
      },
    ],
    operatorCallsign: 'N0CALL',
    notes: 'Test plan',
  };

  it('accepts a valid full plan', () => {
    const result = planInputSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = planInputSchema.safeParse({
      ...validPlan,
      name: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects name longer than 200 characters', () => {
    const result = planInputSchema.safeParse({
      ...validPlan,
      name: 'a'.repeat(201),
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid HH:mm time format', () => {
    const result = planInputSchema.safeParse({
      ...validPlan,
      startTime: '14:00',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid time format', () => {
    const result = planInputSchema.safeParse({
      ...validPlan,
      startTime: '2pm',
    });

    expect(result.success).toBe(false);
  });

  it('accepts undefined equipmentPreset', () => {
    const result = planInputSchema.safeParse({
      ...validPlan,
      equipmentPreset: undefined,
    });

    expect(result.success).toBe(true);
  });
});

describe('planIdSchema', () => {
  it('accepts a valid UUID v4', () => {
    const result = planIdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID values', () => {
    const result = planIdSchema.safeParse('not-a-uuid');
    expect(result.success).toBe(false);
  });

  it('rejects UUID values that are not version 4', () => {
    const result = planIdSchema.safeParse('550e8400-e29b-11d4-a716-446655440000');
    expect(result.success).toBe(false);
  });
});

describe('weatherRequestParamsSchema', () => {
  it('accepts valid coordinates', () => {
    const result = weatherRequestParamsSchema.safeParse({
      latitude: 39.7,
      longitude: -104.9,
    });

    expect(result.success).toBe(true);
  });

  it('rejects latitude > 90', () => {
    const result = weatherRequestParamsSchema.safeParse({
      latitude: 91,
      longitude: 0,
    });

    expect(result.success).toBe(false);
  });

  it('rejects longitude < -180', () => {
    const result = weatherRequestParamsSchema.safeParse({
      latitude: 0,
      longitude: -181,
    });

    expect(result.success).toBe(false);
  });

  it('accepts missing hourlyCount and dailyCount', () => {
    const result = weatherRequestParamsSchema.safeParse({
      latitude: 0,
      longitude: 0,
    });

    expect(result.success).toBe(true);
  });

  it('rejects hourlyCount greater than 48', () => {
    const result = weatherRequestParamsSchema.safeParse({
      latitude: 0,
      longitude: 0,
      hourlyCount: 49,
    });

    expect(result.success).toBe(false);
  });
});

describe('configSetParamsSchema', () => {
  it('accepts valid theme updates', () => {
    const result = configSetParamsSchema.safeParse({
      updates: { theme: 'dark' },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid theme values', () => {
    const result = configSetParamsSchema.safeParse({
      updates: { theme: 'blue' },
    });

    expect(result.success).toBe(false);
  });
});

describe('exportFormatSchema', () => {
  it.each(['json', 'adif', 'pdf'])('accepts valid format: %s', (format) => {
    const result = exportFormatSchema.safeParse(format);
    expect(result.success).toBe(true);
  });

  it.each(['markdown', 'xml'])('rejects invalid format: %s', (format) => {
    const result = exportFormatSchema.safeParse(format);
    expect(result.success).toBe(false);
  });
});

describe('openExternalParamsSchema', () => {
  it('accepts a valid URL', () => {
    const result = openExternalParamsSchema.safeParse({
      url: 'https://example.com',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL', () => {
    const result = openExternalParamsSchema.safeParse({
      url: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });
});

describe('ipcResponseSchema', () => {
  const responseSchema = ipcResponseSchema(z.object({ id: z.string() }));

  it('accepts success responses', () => {
    const result = responseSchema.safeParse({
      success: true,
      data: { id: '123' },
    });

    expect(result.success).toBe(true);
  });

  it('accepts error responses', () => {
    const result = responseSchema.safeParse({
      success: false,
      error: 'msg',
    });

    expect(result.success).toBe(true);
  });

  it('accepts error responses with valid errorCode', () => {
    const result = responseSchema.safeParse({
      success: false,
      error: 'msg',
      errorCode: 'NOT_FOUND',
    });

    expect(result.success).toBe(true);
  });

  it('rejects error responses with invalid errorCode', () => {
    const result = responseSchema.safeParse({
      success: false,
      error: 'msg',
      errorCode: 'UNKNOWN',
    });

    expect(result.success).toBe(false);
  });
});
