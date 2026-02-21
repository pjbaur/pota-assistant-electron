import { useNavigate } from 'react-router-dom';
import type { Plan, PlanStatus } from '@shared/types';

interface PlanCardProps {
  plan: Plan;
}

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

function formatDuration(startTime: string, endTime: string): string {
  const [startHourStr, startMinStr] = startTime.split(':');
  const [endHourStr, endMinStr] = endTime.split(':');

  const startHour = parseInt(startHourStr ?? '0', 10);
  const startMin = parseInt(startMinStr ?? '0', 10);
  const endHour = parseInt(endHourStr ?? '0', 10);
  const endMin = parseInt(endMinStr ?? '0', 10);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationMinutes = endMinutes - startMinutes;

  if (durationMinutes < 0) {
    // Overnight activation
    const totalMinutes = 24 * 60 - startMinutes + endMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
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

export function PlanCard({ plan }: PlanCardProps): JSX.Element {
  const navigate = useNavigate();

  const handleClick = (): void => {
    navigate(`/plans/${plan.id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-slate-200 dark:bg-slate-800 dark:hover:ring-slate-700 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {plan.name || `${plan.parkReference} Activation`}
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[plan.status]}`}
            >
              {statusLabels[plan.status]}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {plan.parkReference}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{formatDate(plan.activationDate)}</span>
            </div>

            <div className="flex items-center gap-1.5">
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
                {formatTime(plan.startTime)} - {formatTime(plan.endTime)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
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
                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
              </svg>
              <span>{formatDuration(plan.startTime, plan.endTime)}</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
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
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {plan.equipmentPreset && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
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
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="truncate">
              {plan.equipmentPreset.name}
              {plan.equipmentPreset.radio && ` - ${plan.equipmentPreset.radio}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
