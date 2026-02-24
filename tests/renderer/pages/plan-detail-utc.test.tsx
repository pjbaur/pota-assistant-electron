import { describe, it, expect } from 'vitest';

// These are the UTC conversion functions from plan-detail.tsx
// We'll test them directly by replicating the logic here

/**
 * Parse a timezone offset string like "GMT-7" or "UTC+5:30" to minutes
 */
function parseOffsetMinutes(offsetLabel: string): number | null {
  if (offsetLabel === 'GMT' || offsetLabel === 'UTC') {
    return 0;
  }

  const match = offsetLabel.match(/(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) {
    return null;
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return sign * (hours * 60 + minutes);
}

/**
 * Get timezone offset in minutes at a specific timestamp
 */
function getOffsetMinutesAt(timestampMs: number, timezone: string): number | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date(timestampMs));
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    return parseOffsetMinutes(offset);
  } catch {
    return null;
  }
}

/**
 * Convert park local time to UTC timestamp in milliseconds
 */
function toUtcTimestamp(dateString: string, timeString: string, timezone: string): number | null {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) ||
      !Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  // Create a UTC timestamp assuming the input time is in UTC
  const baseUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  if (timezone === 'UTC') {
    return baseUtc;
  }

  // Get the offset at this time and adjust
  const firstOffset = getOffsetMinutesAt(baseUtc, timezone);
  if (firstOffset === null) {
    return baseUtc;
  }

  // Adjust for the offset
  let adjusted = baseUtc - firstOffset * 60_000;

  // Check if the offset changed due to DST transition
  const secondOffset = getOffsetMinutesAt(adjusted, timezone);
  if (secondOffset !== null && secondOffset !== firstOffset) {
    adjusted = baseUtc - secondOffset * 60_000;
  }

  return adjusted;
}

/**
 * Convert UTC timestamp back to local time in the given timezone
 */
function utcToLocalTime(utcTimestamp: number, timezone: string): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(utcTimestamp));
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { hour, minute };
}

describe('UTC Time Conversion', () => {
  describe('parseOffsetMinutes', () => {
    it('parses UTC offset with positive hours', () => {
      expect(parseOffsetMinutes('UTC+5')).toBe(300);
      expect(parseOffsetMinutes('GMT+10')).toBe(600);
    });

    it('parses UTC offset with negative hours', () => {
      expect(parseOffsetMinutes('UTC-7')).toBe(-420);
      expect(parseOffsetMinutes('GMT-8')).toBe(-480);
    });

    it('parses UTC offset with hours and minutes', () => {
      expect(parseOffsetMinutes('UTC+5:30')).toBe(330);
      expect(parseOffsetMinutes('UTC-9:30')).toBe(-570);
    });

    it('returns 0 for UTC or GMT without offset', () => {
      expect(parseOffsetMinutes('UTC')).toBe(0);
      expect(parseOffsetMinutes('GMT')).toBe(0);
    });

    it('returns null for invalid offset strings', () => {
      expect(parseOffsetMinutes('invalid')).toBeNull();
      expect(parseOffsetMinutes('EST')).toBeNull();
    });
  });

  describe('toUtcTimestamp', () => {
    it('converts America/Denver (MST) time to UTC correctly', () => {
      // 9:00 AM MST = 16:00 UTC (MST is UTC-7)
      const result = toUtcTimestamp('2024-01-15', '09:00', 'America/Denver');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcDate = new Date(result);
        expect(utcDate.getUTCHours()).toBe(16);
        expect(utcDate.getUTCMinutes()).toBe(0);
      }
    });

    it('converts America/New_York (EST) time to UTC correctly', () => {
      // 9:00 AM EST = 14:00 UTC (EST is UTC-5)
      const result = toUtcTimestamp('2024-01-15', '09:00', 'America/New_York');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcDate = new Date(result);
        expect(utcDate.getUTCHours()).toBe(14);
        expect(utcDate.getUTCMinutes()).toBe(0);
      }
    });

    it('converts America/Los_Angeles (PST) time to UTC correctly', () => {
      // 9:00 AM PST = 17:00 UTC (PST is UTC-8)
      const result = toUtcTimestamp('2024-01-15', '09:00', 'America/Los_Angeles');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcDate = new Date(result);
        expect(utcDate.getUTCHours()).toBe(17);
        expect(utcDate.getUTCMinutes()).toBe(0);
      }
    });

    it('converts Europe/London (GMT) time to UTC correctly in winter', () => {
      // 9:00 AM GMT = 09:00 UTC
      const result = toUtcTimestamp('2024-01-15', '09:00', 'Europe/London');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcDate = new Date(result);
        expect(utcDate.getUTCHours()).toBe(9);
        expect(utcDate.getUTCMinutes()).toBe(0);
      }
    });

    it('converts Asia/Tokyo (JST) time to UTC correctly', () => {
      // 9:00 AM JST = 00:00 UTC (JST is UTC+9)
      const result = toUtcTimestamp('2024-01-15', '09:00', 'Asia/Tokyo');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcDate = new Date(result);
        expect(utcDate.getUTCHours()).toBe(0);
        expect(utcDate.getUTCMinutes()).toBe(0);
      }
    });

    it('handles UTC timezone without conversion', () => {
      const result = toUtcTimestamp('2024-01-15', '09:00', 'UTC');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcDate = new Date(result);
        expect(utcDate.getUTCHours()).toBe(9);
        expect(utcDate.getUTCMinutes()).toBe(0);
      }
    });
  });

  describe('round-trip conversion (local -> UTC -> local)', () => {
    it('round-trips correctly for America/Denver', () => {
      const originalHour = 9;
      const originalMinute = 30;
      const result = toUtcTimestamp('2024-01-15', `${originalHour.toString().padStart(2, '0')}:${originalMinute.toString().padStart(2, '0')}`, 'America/Denver');
      expect(result).not.toBeNull();

      if (result !== null) {
        const localTime = utcToLocalTime(result, 'America/Denver');
        expect(localTime.hour).toBe(originalHour);
        expect(localTime.minute).toBe(originalMinute);
      }
    });

    it('round-trips correctly for America/New_York', () => {
      const originalHour = 14;
      const originalMinute = 45;
      const result = toUtcTimestamp('2024-01-15', `${originalHour.toString().padStart(2, '0')}:${originalMinute.toString().padStart(2, '0')}`, 'America/New_York');
      expect(result).not.toBeNull();

      if (result !== null) {
        const localTime = utcToLocalTime(result, 'America/New_York');
        expect(localTime.hour).toBe(originalHour);
        expect(localTime.minute).toBe(originalMinute);
      }
    });

    it('round-trips correctly for Asia/Tokyo', () => {
      const originalHour = 18;
      const originalMinute = 15;
      const result = toUtcTimestamp('2024-01-15', `${originalHour.toString().padStart(2, '0')}:${originalMinute.toString().padStart(2, '0')}`, 'Asia/Tokyo');
      expect(result).not.toBeNull();

      if (result !== null) {
        const localTime = utcToLocalTime(result, 'Asia/Tokyo');
        expect(localTime.hour).toBe(originalHour);
        expect(localTime.minute).toBe(originalMinute);
      }
    });

    it('round-trips correctly for Europe/London during BST (summer)', () => {
      // July is during BST (British Summer Time, UTC+1)
      const originalHour = 10;
      const originalMinute = 0;
      const result = toUtcTimestamp('2024-07-15', `${originalHour.toString().padStart(2, '0')}:${originalMinute.toString().padStart(2, '0')}`, 'Europe/London');
      expect(result).not.toBeNull();

      if (result !== null) {
        const localTime = utcToLocalTime(result, 'Europe/London');
        expect(localTime.hour).toBe(originalHour);
        expect(localTime.minute).toBe(originalMinute);
      }
    });
  });

  describe('offset consistency', () => {
    it('verifies America/Denver offset is -7 hours in winter (MST)', () => {
      const offset = getOffsetMinutesAt(Date.UTC(2024, 0, 15, 12, 0, 0), 'America/Denver');
      expect(offset).toBe(-420); // -7 hours = -420 minutes
    });

    it('verifies America/Denver offset is -6 hours in summer (MDT)', () => {
      const offset = getOffsetMinutesAt(Date.UTC(2024, 6, 15, 12, 0, 0), 'America/Denver');
      expect(offset).toBe(-360); // -6 hours = -360 minutes (DST)
    });

    it('verifies America/New_York offset is -5 hours in winter (EST)', () => {
      const offset = getOffsetMinutesAt(Date.UTC(2024, 0, 15, 12, 0, 0), 'America/New_York');
      expect(offset).toBe(-300); // -5 hours = -300 minutes
    });

    it('verifies America/New_York offset is -4 hours in summer (EDT)', () => {
      const offset = getOffsetMinutesAt(Date.UTC(2024, 6, 15, 12, 0, 0), 'America/New_York');
      expect(offset).toBe(-240); // -4 hours = -240 minutes (DST)
    });
  });
});
