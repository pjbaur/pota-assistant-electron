import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export function NewPlan(): JSX.Element {
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            New Activation Plan
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Create a new activation plan using the step-by-step wizard
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <StepIndicator step={1} label="Select Park" isActive />
            <StepIndicator step={2} label="Date & Time" />
            <StepIndicator step={3} label="Equipment" />
            <StepIndicator step={4} label="Bands" />
            <StepIndicator step={5} label="Review" />
          </div>
        </div>

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
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Plan Wizard Coming Soon
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              The activation plan wizard will guide you through creating a complete plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  step: number;
  label: string;
  isActive?: boolean;
  isComplete?: boolean;
}

function StepIndicator({
  step,
  label,
  isActive = false,
  isComplete = false,
}: StepIndicatorProps): JSX.Element {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          isActive
            ? 'bg-primary-600 text-white'
            : isComplete
              ? 'bg-success-500 text-white'
              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
        }`}
      >
        {isComplete ? (
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
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          step
        )}
      </div>
      <span
        className={`mt-2 text-xs font-medium ${
          isActive
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-slate-600 dark:text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
