import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button, Dialog, DialogContent, DialogTrigger, DialogClose } from '../components/ui';
import { WeatherWidget } from '../components/weather';
import { BandPanel } from '../components/band';
import { usePlan, usePlans } from '../hooks/use-plans';
import { usePark } from '../hooks/use-parks';
import { useWeather } from '../hooks/use-weather';
import { useBands } from '../hooks/use-bands';
import { useUIStore } from '../stores/ui-store';
import type { ExportFormat, PlanStatus } from '@shared/types';

const statusStyles: Record<PlanStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  finalized: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  completed: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  cancelled: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300',
};

const statusLabels: Record<PlanStatus, string> = {
  draft: 'Draft',
  finalized: 'Finalized',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr ?? '0', 10);
  const minute = parseInt(minuteStr ?? '0', 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function formatDuration(startTime: string, endTime: string): string {
  const [startHourStr, startMinStr] = startTime.split(':');
  const [endHourStr, endMinStr] = endTime.split(':');

  const startHour = parseInt(startHourStr ?? '0', 10);
  const startMin = parseInt(startMinStr ?? '0', 10);
  const endHour = parseInt(endHourStr ?? '0', 10);
  const endMin = parseInt(endMinStr ?? '0', 10);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationMinutes = Math.abs(endMinutes - startMinutes);

  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Format timezone for display
 */
function formatTimezone(timezone: string): { city: string; abbreviation: string; offset: string; iana: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(new Date());
    const tzNamePart = parts.find((p) => p.type === 'timeZoneName');
    const abbreviation = tzNamePart?.value ?? timezone;

    const cityPart = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone;

    // Get UTC offset using proper timezone offset calculation
    const now = new Date();
    const tzOffsetMinutes = -new Date(now.toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset() -
      -new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTimezoneOffset();
    const hours = Math.floor(Math.abs(tzOffsetMinutes) / 60);
    const minutes = Math.abs(tzOffsetMinutes) % 60;
    const sign = tzOffsetMinutes >= 0 ? '+' : '-';
    const offset = minutes > 0 ? `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}` : `UTC${sign}${hours}`;

    return { city: cityPart, abbreviation, offset, iana: timezone };
  } catch {
    return { city: timezone, abbreviation: timezone, offset: '', iana: timezone };
  }
}

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
 * Convert park local time to UTC and format for display
 */
function convertToUTC(dateString: string, timeString: string, timezone: string): string {
  try {
    const utcTimestamp = toUtcTimestamp(dateString, timeString, timezone);
    if (utcTimestamp === null) {
      return `${timeString} UTC`;
    }

    const utcDate = new Date(utcTimestamp);
    const utcHour = utcDate.getUTCHours();
    const utcMinute = utcDate.getUTCMinutes();
    const ampm = utcHour >= 12 ? 'PM' : 'AM';
    const displayHour = utcHour % 12 || 12;

    return `${displayHour}:${utcMinute.toString().padStart(2, '0')} ${ampm} UTC`;
  } catch {
    return `${timeString} UTC`;
  }
}

/**
 * Get UTC date for a park local date
 */
function getUTCDate(dateString: string, timezone: string): string {
  try {
    // Use noon to avoid date boundary issues
    const utcTimestamp = toUtcTimestamp(dateString, '12:00', timezone);
    if (utcTimestamp === null) {
      return dateString;
    }

    return new Date(utcTimestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateString;
  }
}

export function PlanDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { plan, isLoading, error, fetchPlan } = usePlan(id ?? null);
  const { deletePlan } = usePlans();
  const addToast = useUIStore((state) => state.addToast);

  // Fetch park details to get coordinates for weather
  const { park, fetchPark } = usePark(plan?.parkReference ?? null);

  // Weather and band recommendations
  const { weatherData, isLoading: weatherLoading, error: weatherError } = useWeather(
    park?.latitude ?? null,
    park?.longitude ?? null
  );
  const bandsDate = useMemo(
    () => (plan ? new Date(plan.activationDate) : null),
    [plan?.activationDate]
  );
  const { forecast, isLoading: bandsLoading, error: bandsError } = useBands(bandsDate);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch plan on mount
  useEffect(() => {
    void fetchPlan();
  }, [fetchPlan]);

  // Fetch park details when plan is loaded
  useEffect(() => {
    if (plan?.parkReference) {
      void fetchPark();
    }
  }, [plan?.parkReference, fetchPark]);

  const handleDelete = async (): Promise<void> => {
    if (!plan) return;

    setIsDeleting(true);
    try {
      await deletePlan(plan.id);
      addToast({
        title: 'Plan deleted',
        description: 'The activation plan has been deleted.',
        variant: 'success',
      });
      navigate('/plans');
    } catch (err) {
      addToast({
        title: 'Failed to delete plan',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleExport = async (format: ExportFormat): Promise<void> => {
    if (!plan) return;

    setIsExporting(format);
    try {
      const result = await window.electronAPI.invoke('plans:export', {
        id: plan.id,
        format,
      });

      if (result.success && result.data) {
        // Create download
        const { content, filename } = result.data;
        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addToast({
          title: 'Export successful',
          description: `Plan exported as ${format.toUpperCase()}`,
          variant: 'success',
        });
      } else {
        throw new Error(result.error ?? 'Export failed');
      }
    } catch (err) {
      addToast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'error',
      });
    } finally {
      setIsExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/plans">
            <Button variant="ghost" size="sm">
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
                className="mr-1"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Plans
            </Button>
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-8" />
          <div className="space-y-4">
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/plans">
            <Button variant="ghost" size="sm">
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
                className="mr-1"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Plans
            </Button>
          </Link>
        </div>

        <div className="rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 p-6">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-error-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <h2 className="font-semibold text-error-700 dark:text-error-300">Failed to load plan</h2>
              <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void fetchPlan()} className="ml-auto">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/plans">
            <Button variant="ghost" size="sm">
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
                className="mr-1"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Plans
            </Button>
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Plan Not Found</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                The plan you are looking for does not exist or has been deleted.
              </p>
              <Link to="/plans" className="mt-4 inline-block">
                <Button size="sm">Back to Plans</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/plans">
            <Button variant="ghost" size="sm">
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
                className="mr-1"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Plans
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/plans/new?id=${plan.id}`}>
            <Button variant="secondary" size="sm">
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
                className="mr-1"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </Button>
          </Link>

          {/* Export Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="secondary" size="sm">
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
                  className="mr-1"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="z-50 min-w-[140px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                  onSelect={() => void handleExport('json')}
                  disabled={isExporting !== null}
                >
                  {isExporting === 'json' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="mr-2 w-4 text-center text-xs font-mono">{'{ }'}</span>
                  )}
                  JSON
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                  onSelect={() => void handleExport('adif')}
                  disabled={isExporting !== null}
                >
                  {isExporting === 'adif' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="mr-2 w-4 text-center text-xs font-mono">A</span>
                  )}
                  ADIF
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Delete Button with Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="danger" size="sm">
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
                  className="mr-1"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent title="Delete Plan" description="Are you sure you want to delete this plan? This action cannot be undone.">
              <div className="flex justify-end gap-3 mt-2">
                <DialogClose>
                  <Button variant="ghost" size="sm">Cancel</Button>
                </DialogClose>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isDeleting}
                  onClick={() => void handleDelete()}
                >
                  Delete Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-xl bg-white shadow-sm dark:bg-slate-800">
        {/* Title Section */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {plan.name || `${plan.parkReference} Activation`}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-slate-600 dark:text-slate-400">{plan.parkReference}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[plan.status]}`}
                >
                  {statusLabels[plan.status]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-6 space-y-8">
          {/* Schedule Section */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Schedule
            </h2>
            <div className="space-y-6">
              {/* Park Local Time */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {park?.timezone ? (
                    <>
                      Park Local Time
                      <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal">
                        ({formatTimezone(park.timezone).abbreviation}, {formatTimezone(park.timezone).offset}, {formatTimezone(park.timezone).iana})
                      </span>
                    </>
                  ) : 'Park Local Time'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
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
                        className="text-slate-600 dark:text-slate-400"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Date</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(plan.activationDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
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
                        className="text-slate-600 dark:text-slate-400"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Time</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatTime(plan.startTime)} - {formatTime(plan.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
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
                        className="text-slate-600 dark:text-slate-400"
                      >
                        <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Duration</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDuration(plan.startTime, plan.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* UTC Time */}
              {park?.timezone && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    UTC Time
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
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
                          className="text-primary-600 dark:text-primary-400"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Date</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {getUTCDate(plan.activationDate, park.timezone)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
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
                          className="text-primary-600 dark:text-primary-400"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Time</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {convertToUTC(plan.activationDate, plan.startTime, park.timezone)} - {convertToUTC(plan.activationDate, plan.endTime, park.timezone)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 invisible">
                      {/* Spacer to align with Park Local Time grid */}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Weather Section */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Weather Forecast
            </h2>
            {weatherLoading ? (
              <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-32 rounded-lg" />
            ) : weatherError ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Weather unavailable: {weatherError}
              </div>
            ) : weatherData ? (
              <WeatherWidget weatherData={weatherData} />
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                No weather data available. Park coordinates required.
              </div>
            )}
          </section>

          {/* Band Recommendations Section */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Band Recommendations
            </h2>
            {bandsLoading ? (
              <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-32 rounded-lg" />
            ) : bandsError ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Band recommendations unavailable: {bandsError}
              </div>
            ) : forecast ? (
              <BandPanel
                recommendations={forecast}
                plannedBands={plan.bands}
                activationStartTime={plan.startTime}
                activationEndTime={plan.endTime}
              />
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                No band data available.
              </div>
            )}
          </section>

          {/* Equipment Section */}
          {plan.equipmentPreset && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Equipment
              </h2>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
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
                      className="text-slate-600 dark:text-slate-400"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{plan.equipmentPreset.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Equipment Preset</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Radio</p>
                    <p className="font-medium text-slate-900 dark:text-white">{plan.equipmentPreset.radio}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Antenna</p>
                    <p className="font-medium text-slate-900 dark:text-white">{plan.equipmentPreset.antenna}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Power</p>
                    <p className="font-medium text-slate-900 dark:text-white">{plan.equipmentPreset.powerWatts}W</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Mode</p>
                    <p className="font-medium text-slate-900 dark:text-white">{plan.equipmentPreset.mode}</p>
                  </div>
                </div>
                {plan.equipmentPreset.notes && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{plan.equipmentPreset.notes}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Time Slots Section */}
          {plan.timeSlots.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Planned Time Slots
              </h2>
              <div className="space-y-3">
                {plan.timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-sm font-medium text-slate-900 dark:text-white">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                          {slot.band}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {slot.mode}
                        </span>
                      </div>
                    </div>
                    {slot.frequency && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {slot.frequency} MHz
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes Section */}
          {plan.notes && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Notes
              </h2>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {plan.notes}
                </p>
              </div>
            </section>
          )}

          {/* Operator Section */}
          {plan.operatorCallsign && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Operator
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
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
                    className="text-slate-600 dark:text-slate-400"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{plan.operatorCallsign}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Callsign</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer with timestamps */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Created {new Date(plan.createdAt).toLocaleString()}</span>
            <span>Last modified {new Date(plan.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
