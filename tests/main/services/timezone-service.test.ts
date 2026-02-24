import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { findMock } = vi.hoisted(() => ({
  findMock: vi.fn(),
}));

vi.mock('geo-tz', () => ({
  find: findMock,
}));

import {
  formatTimezoneForDisplay,
  getTimezone,
  getTimezoneAbbreviation,
  getTimezoneOffset,
} from '../../../src/main/services/timezone-service';

describe('main/services/timezone-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns IANA timezones from geo-tz lookups', () => {
    findMock.mockReturnValueOnce(['America/Denver']);
    findMock.mockReturnValueOnce(['Asia/Tokyo']);

    expect(getTimezone(39.7392, -104.9903)).toBe('America/Denver');
    expect(getTimezone(35.6762, 139.6503)).toBe('Asia/Tokyo');
  });

  it('returns null when geo-tz throws or returns empty results', () => {
    findMock.mockImplementationOnce(() => {
      throw new Error('geo-tz failure');
    });
    findMock.mockReturnValueOnce([]);

    expect(getTimezone(0, 0)).toBeNull();
    expect(getTimezone(10, 10)).toBeNull();
  });

  it('formats timezone display values and replaces underscores', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () => ({
        formatToParts: () => [{ type: 'timeZoneName', value: 'EST' }],
      }) as unknown as Intl.DateTimeFormat
    );

    expect(formatTimezoneForDisplay('America/Denver')).toBe('Denver (EST)');
    expect(formatTimezoneForDisplay('America/New_York')).toBe('New York (EST)');
  });

  it('returns timezone abbreviations and falls back for invalid zones', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () => ({
        formatToParts: () => [{ type: 'timeZoneName', value: 'MST' }],
      }) as unknown as Intl.DateTimeFormat
    );

    expect(getTimezoneAbbreviation('America/Denver')).toBe('MST');
    expect(getTimezoneAbbreviation('Invalid/Timezone')).toBe('MST');

    vi.restoreAllMocks();
    expect(getTimezoneAbbreviation('Invalid/Timezone')).toBe('Invalid/Timezone');
  });

  it('returns UTC offsets for standard and half-hour timezones', () => {
    expect(getTimezoneOffset('America/Denver')).toBe('UTC-7');
    expect(getTimezoneOffset('Asia/Kolkata')).toBe('UTC+5:30');
  });

  it('returns fallback values when Intl timezone formatting fails', () => {
    expect(formatTimezoneForDisplay('Invalid/Timezone')).toBe('Invalid/Timezone');
    expect(getTimezoneOffset('Invalid/Timezone')).toBe('UTC?');
  });
});
