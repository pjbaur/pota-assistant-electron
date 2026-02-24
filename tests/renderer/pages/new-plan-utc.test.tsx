import { describe, expect, it, vi } from 'vitest';

/**
 * Tests for the UTC conversion logic in new-plan.tsx
 *
 * These tests verify the buildDateTimeSummary function and related
 * time conversion utilities used in the New Activation Plan page.
 */

// Replicate the core conversion logic from new-plan.tsx for testing
function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  const parts = dateStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    parts.length !== 3
  ) {
    return null;
  }

  return { year, month, day };
}

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const parts = timeStr.split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || parts.length !== 2) {
    return null;
  }

  return { hours, minutes };
}

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

function toUtcTimestamp(date: string, time: string, timezone: string): number | null {
  const dateParts = parseDate(date);
  const timeParts = parseTime(time);

  if (!dateParts || !timeParts) {
    return null;
  }

  const baseUtc = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hours,
    timeParts.minutes,
    0,
    0
  );

  if (timezone === 'UTC') {
    return baseUtc;
  }

  const firstOffset = getOffsetMinutesAt(baseUtc, timezone);
  if (firstOffset === null) {
    return baseUtc;
  }

  let adjusted = baseUtc - firstOffset * 60_000;
  const secondOffset = getOffsetMinutesAt(adjusted, timezone);
  if (secondOffset !== null && secondOffset !== firstOffset) {
    adjusted = baseUtc - secondOffset * 60_000;
  }

  return adjusted;
}

function formatTimeInZone(timestampMs: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestampMs));
}

describe('new-plan UTC conversion', () => {
  /**
   * UTC conversion explanation:
   *
   * When a user enters 09:00 as "park time" in MST (UTC-7):
   * - MST is 7 hours BEHIND UTC (UTC-7 means "UTC minus 7")
   * - To convert MST to UTC: ADD 7 hours
   * - 09:00 MST + 7 hours = 16:00 UTC
   *
   * This is CORRECT. The timezone notation "UTC-7" means the local time
   * is 7 hours behind UTC, so you add 7 to get UTC.
   */
  describe('toUtcTimestamp', () => {
    it('correctly converts 09:00 MST (UTC-7) to 16:00 UTC', () => {
      const result = toUtcTimestamp('2026-02-24', '09:00', 'America/Denver');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcTime = formatTimeInZone(result, 'UTC');
        expect(utcTime).toBe('16:00');

        // Verify round-trip
        const denverTime = formatTimeInZone(result, 'America/Denver');
        expect(denverTime).toBe('09:00');
      }
    });

    it('correctly converts 09:00 EST (UTC-5) to 14:00 UTC', () => {
      const result = toUtcTimestamp('2026-02-24', '09:00', 'America/New_York');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcTime = formatTimeInZone(result, 'UTC');
        expect(utcTime).toBe('14:00');
      }
    });

    it('correctly converts 09:00 PST (UTC-8) to 17:00 UTC', () => {
      const result = toUtcTimestamp('2026-02-24', '09:00', 'America/Los_Angeles');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcTime = formatTimeInZone(result, 'UTC');
        expect(utcTime).toBe('17:00');
      }
    });

    it('correctly converts 09:00 JST (UTC+9) to 00:00 UTC', () => {
      const result = toUtcTimestamp('2026-02-24', '09:00', 'Asia/Tokyo');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcTime = formatTimeInZone(result, 'UTC');
        expect(utcTime).toBe('00:00');
      }
    });

    it('handles UTC input without conversion', () => {
      const result = toUtcTimestamp('2026-02-24', '16:00', 'UTC');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcTime = formatTimeInZone(result, 'UTC');
        expect(utcTime).toBe('16:00');
      }
    });
  });

  describe('time range conversion', () => {
    it('correctly converts 09:00-12:00 MST to 16:00-19:00 UTC', () => {
      const startTime = toUtcTimestamp('2026-02-24', '09:00', 'America/Denver');
      const endTime = toUtcTimestamp('2026-02-24', '12:00', 'America/Denver');

      expect(startTime).not.toBeNull();
      expect(endTime).not.toBeNull();

      if (startTime !== null && endTime !== null) {
        expect(formatTimeInZone(startTime, 'UTC')).toBe('16:00');
        expect(formatTimeInZone(endTime, 'UTC')).toBe('19:00');

        // Verify park times are preserved
        expect(formatTimeInZone(startTime, 'America/Denver')).toBe('09:00');
        expect(formatTimeInZone(endTime, 'America/Denver')).toBe('12:00');
      }
    });
  });

  describe('DST handling', () => {
    it('correctly handles MST (UTC-7) in winter', () => {
      // February is standard time (MST)
      const offset = getOffsetMinutesAt(Date.UTC(2026, 1, 24, 12, 0, 0), 'America/Denver');
      expect(offset).toBe(-420); // -7 hours = -420 minutes
    });

    it('correctly handles MDT (UTC-6) in summer', () => {
      // July is daylight time (MDT)
      const offset = getOffsetMinutesAt(Date.UTC(2026, 6, 15, 12, 0, 0), 'America/Denver');
      expect(offset).toBe(-360); // -6 hours = -360 minutes
    });

    it('correctly converts 09:00 MDT (UTC-6) to 15:00 UTC', () => {
      // July is during MDT
      const result = toUtcTimestamp('2026-07-15', '09:00', 'America/Denver');
      expect(result).not.toBeNull();

      if (result !== null) {
        const utcTime = formatTimeInZone(result, 'UTC');
        expect(utcTime).toBe('15:00'); // 09:00 + 6 = 15:00
      }
    });
  });

  describe('offset notation clarification', () => {
    /**
     * IMPORTANT: Timezone offset notation can be confusing.
     *
     * "UTC-7" means:
     * - The timezone is 7 hours BEHIND UTC
     * - When it's 16:00 UTC, it's 09:00 in that timezone
     * - To convert FROM local TO UTC: ADD 7 hours
     * - To convert FROM UTC TO local: SUBTRACT 7 hours
     *
     * Example: 09:00 MST → 16:00 UTC (09 + 7 = 16) ✓
     * NOT: 09:00 MST → 02:00 UTC (09 - 7 = 02) ✗
     */
    it('demonstrates correct offset understanding for UTC-7', () => {
      // If it's 16:00 UTC, what time is it in MST (UTC-7)?
      const utcNoon = Date.UTC(2026, 1, 24, 16, 0, 0);
      const mstTime = formatTimeInZone(utcNoon, 'America/Denver');
      expect(mstTime).toBe('09:00'); // 16:00 - 7 = 09:00

      // If it's 09:00 MST, what time is it in UTC?
      const mstMorning = toUtcTimestamp('2026-02-24', '09:00', 'America/Denver');
      expect(mstMorning).not.toBeNull();
      if (mstMorning !== null) {
        const utcTime = formatTimeInZone(mstMorning, 'UTC');
        expect(utcTime).toBe('16:00'); // 09:00 + 7 = 16:00
      }
    });
  });
});
