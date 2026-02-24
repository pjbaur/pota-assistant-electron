import { useState, useCallback, useMemo } from 'react';
import { Input, Select } from '../../ui';

export type TimeReference = 'park' | 'utc';

export interface DateTimeData {
  date: string;
  startTime: string;
  endTime: string;
  timeReference: TimeReference;
}

export interface StepDatetimeProps {
  data: DateTimeData;
  onChange: (data: DateTimeData) => void;
  /** Optional park timezone (IANA identifier) */
  parkTimezone?: string;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface TimeParts {
  hours: number;
  minutes: number;
}

/**
 * Format timezone for display
 */
function formatTimezone(timezone: string): { city: string; abbreviation: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(new Date());
    const tzNamePart = parts.find((p) => p.type === 'timeZoneName');
    const abbreviation = tzNamePart?.value ?? timezone;

    const cityPart = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone;
    return { city: cityPart, abbreviation };
  } catch {
    return { city: timezone, abbreviation: timezone };
  }
}

function parseDate(dateStr: string): DateParts | null {
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

function parseTime(timeStr: string): TimeParts | null {
  const parts = timeStr.split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || parts.length !== 2) {
    return null;
  }

  return { hours, minutes };
}

function formatDateParts(date: DateParts): string {
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function formatDateInZone(timestampMs: number, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date(timestampMs));
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return '';
  }

  return formatDateParts({ year, month, day });
}

function formatTimeInZone(timestampMs: number, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(new Date(timestampMs));
}

function formatLongDateInZone(timestampMs: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(timestampMs));
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

function addDays(date: string, days: number): string {
  const parts = parseDate(date);
  if (!parts) {
    return date;
  }

  const value = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatDateInZone(value.getTime(), 'UTC');
}

function timeToMinutes(time: string): number {
  const parts = parseTime(time);
  if (!parts) {
    return 0;
  }
  return parts.hours * 60 + parts.minutes;
}

function addHoursToTime(time: string, hoursToAdd: number): string {
  const parts = parseTime(time);
  if (!parts) {
    return time;
  }

  const totalMinutes = parts.hours * 60 + parts.minutes + hoursToAdd * 60;
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getTodayForTimezone(timezone: string): string {
  return formatDateInZone(Date.now(), timezone);
}

const DURATION_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '2', label: '2 hours' },
  { value: '3', label: '3 hours' },
  { value: '4', label: '4 hours' },
  { value: '5', label: '5 hours' },
  { value: '6', label: '6 hours' },
  { value: '7', label: '7 hours' },
  { value: '8', label: '8 hours' },
];

export function StepDatetime({ data, onChange, parkTimezone }: StepDatetimeProps): JSX.Element {
  const [duration, setDuration] = useState<string>('3');

  const timezoneInfo = useMemo(() => {
    if (!parkTimezone) return null;
    return formatTimezone(parkTimezone);
  }, [parkTimezone]);

  const effectiveTimeReference =
    data.timeReference === 'utc' ? 'utc' : parkTimezone ? 'park' : 'utc';

  const inputTimezone = effectiveTimeReference === 'park' && parkTimezone ? parkTimezone : 'UTC';
  const parkDisplayTimezone = parkTimezone ?? 'UTC';

  const today = useMemo(() => {
    return getTodayForTimezone(inputTimezone);
  }, [inputTimezone]);

  const handleTimeReferenceChange = useCallback(
    (newReference: TimeReference) => {
      if (newReference === effectiveTimeReference) {
        return;
      }

      const nextTimezone = newReference === 'park' && parkTimezone ? parkTimezone : 'UTC';
      const currentTimezone =
        effectiveTimeReference === 'park' && parkTimezone ? parkTimezone : 'UTC';

      if (!data.date || !data.startTime || !data.endTime) {
        onChange({ ...data, timeReference: newReference });
        return;
      }

      const startUtc = toUtcTimestamp(data.date, data.startTime, currentTimezone);

      const endSourceDate =
        timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)
          ? addDays(data.date, 1)
          : data.date;
      const endUtc = toUtcTimestamp(endSourceDate, data.endTime, currentTimezone);

      if (startUtc === null || endUtc === null) {
        onChange({ ...data, timeReference: newReference });
        return;
      }

      onChange({
        ...data,
        date: formatDateInZone(startUtc, nextTimezone),
        startTime: formatTimeInZone(startUtc, nextTimezone),
        endTime: formatTimeInZone(endUtc, nextTimezone),
        timeReference: newReference,
      });
    },
    [data, onChange, parkTimezone, effectiveTimeReference]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...data, date: e.target.value, timeReference: effectiveTimeReference });
    },
    [data, onChange, effectiveTimeReference]
  );

  const handleStartTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStartTime = e.target.value;
      if (newStartTime && duration) {
        const endTime = addHoursToTime(newStartTime, parseInt(duration, 10));
        onChange({
          ...data,
          startTime: newStartTime,
          endTime,
          timeReference: effectiveTimeReference,
        });
      } else {
        onChange({ ...data, startTime: newStartTime, timeReference: effectiveTimeReference });
      }
    },
    [data, duration, onChange, effectiveTimeReference]
  );

  const handleDurationChange = useCallback(
    (newDuration: string) => {
      setDuration(newDuration);
      if (data.startTime && newDuration) {
        const endTime = addHoursToTime(data.startTime, parseInt(newDuration, 10));
        onChange({ ...data, endTime, timeReference: effectiveTimeReference });
      }
    },
    [data, onChange, effectiveTimeReference]
  );

  const dateError = useMemo(() => {
    if (!data.date) return undefined;
    if (today !== undefined && data.date < today) {
      return 'Date must be today or in the future';
    }
    return undefined;
  }, [data.date, today]);

  const summary = useMemo(() => {
    if (!data.date || !data.startTime || !data.endTime) {
      return null;
    }

    const startUtc = toUtcTimestamp(data.date, data.startTime, inputTimezone);
    const endDate =
      timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)
        ? addDays(data.date, 1)
        : data.date;
    const endUtc = toUtcTimestamp(endDate, data.endTime, inputTimezone);

    if (startUtc === null || endUtc === null) {
      return null;
    }

    return {
      park: {
        label: timezoneInfo
          ? `Park Time (${timezoneInfo.city} ${timezoneInfo.abbreviation})`
          : 'Park Time',
        date: formatLongDateInZone(startUtc, parkDisplayTimezone),
        startTime: formatTimeInZone(startUtc, parkDisplayTimezone),
        endTime: formatTimeInZone(endUtc, parkDisplayTimezone),
      },
      utc: {
        label: 'UTC',
        date: formatLongDateInZone(startUtc, 'UTC'),
        startTime: formatTimeInZone(startUtc, 'UTC'),
        endTime: formatTimeInZone(endUtc, 'UTC'),
      },
    };
  }, [data.date, data.startTime, data.endTime, inputTimezone, parkDisplayTimezone, timezoneInfo]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Date & Time</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Choose when you plan to activate the park
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Time Reference
        </label>
        <div className="relative inline-grid grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
          <span
            className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-white shadow-sm transition-transform duration-200 dark:bg-slate-800 ${
              effectiveTimeReference === 'utc'
                ? 'translate-x-[calc(100%+0.25rem)]'
                : 'translate-x-0'
            }`}
          />
          <button
            type="button"
            onClick={() => handleTimeReferenceChange('park')}
            disabled={!parkTimezone}
            className={`relative z-10 min-w-[9rem] rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              effectiveTimeReference === 'park'
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-300'
            } ${!parkTimezone ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            Park Time
          </button>
          <button
            type="button"
            onClick={() => handleTimeReferenceChange('utc')}
            className={`relative z-10 min-w-[6rem] rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              effectiveTimeReference === 'utc'
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            UTC
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Activation Date"
          type="date"
          value={data.date}
          onChange={handleDateChange}
          min={today}
          variant={dateError ? 'error' : 'default'}
          helperText={dateError}
        />

        <Input
          label="Start Time"
          type="time"
          value={data.startTime}
          onChange={handleStartTimeChange}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label="Duration"
          options={DURATION_OPTIONS}
          value={duration}
          onChange={handleDurationChange}
        />

        <Input label="End Time" type="time" value={data.endTime} disabled />
      </div>

      {timezoneInfo && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              Park timezone: <strong>{timezoneInfo.city}</strong> ({timezoneInfo.abbreviation}).
              Input uses <strong>{effectiveTimeReference === 'utc' ? 'UTC' : 'park time'}</strong>.
            </span>
          </div>
        </div>
      )}

      {summary && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 text-primary-600 dark:text-primary-400"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div className="grid w-full gap-3 md:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {summary.park.label}
                </div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {summary.park.date}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {summary.park.startTime} - {summary.park.endTime} ({duration}{' '}
                  {parseInt(duration, 10) === 1 ? 'hour' : 'hours'})
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {summary.utc.label}
                </div>
                <div className="font-medium text-slate-900 dark:text-white">{summary.utc.date}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {summary.utc.startTime} - {summary.utc.endTime} ({duration}{' '}
                  {parseInt(duration, 10) === 1 ? 'hour' : 'hours'})
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
