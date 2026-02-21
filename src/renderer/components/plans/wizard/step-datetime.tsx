import { useState, useCallback, useMemo } from 'react';
import { Input, Select } from '../../ui';

export interface DateTimeData {
  date: string;
  startTime: string;
  endTime: string;
}

export interface StepDatetimeProps {
  data: DateTimeData;
  onChange: (data: DateTimeData) => void;
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

export function StepDatetime({ data, onChange }: StepDatetimeProps): JSX.Element {
  const [duration, setDuration] = useState<string>('3');

  const today = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...data, date: e.target.value });
    },
    [data, onChange]
  );

  const handleStartTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStartTime = e.target.value;
      // Calculate end time based on duration
      if (newStartTime && duration) {
        const parts = newStartTime.split(':').map(Number);
        const hours = parts[0] ?? 0;
        const minutes = parts[1] ?? 0;
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0);
        startDate.setHours(startDate.getHours() + parseInt(duration, 10));
        const endTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
        onChange({ ...data, startTime: newStartTime, endTime });
      } else {
        onChange({ ...data, startTime: newStartTime });
      }
    },
    [data, duration, onChange]
  );

  const handleDurationChange = useCallback(
    (newDuration: string) => {
      setDuration(newDuration);
      // Recalculate end time
      if (data.startTime && newDuration) {
        const parts = data.startTime.split(':').map(Number);
        const hours = parts[0] ?? 0;
        const minutes = parts[1] ?? 0;
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0);
        startDate.setHours(startDate.getHours() + parseInt(newDuration, 10));
        const endTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
        onChange({ ...data, endTime });
      }
    },
    [data, onChange]
  );

  const dateError = useMemo(() => {
    if (!data.date) return undefined;
    if (today !== undefined && data.date < today) {
      return 'Date must be today or in the future';
    }
    return undefined;
  }, [data.date, today]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Date & Time</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Choose when you plan to activate the park
        </p>
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

      {data.date && data.startTime && (
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
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                {new Date(data.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {data.startTime} - {data.endTime} ({duration} {parseInt(duration, 10) === 1 ? 'hour' : 'hours'})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
