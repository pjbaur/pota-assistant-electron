import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePark } from '../hooks/use-parks';
import { Button } from '../components/ui';
import { ParkInfoCard, ParkMiniMap } from '../components/parks';

export function ParkDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { park, isLoading, error, fetchPark } = usePark(id ?? null);

  useEffect(() => {
    void fetchPark();
  }, [id, fetchPark]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/parks">
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
              Back to Parks
            </Button>
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Loading park details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/parks">
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
              Back to Parks
            </Button>
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
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
                  className="text-error-600 dark:text-error-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Error Loading Park
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {error}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void fetchPark()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!park) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/parks">
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
              Back to Parks
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
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Park Not Found
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                The park with reference <span className="font-mono">{id}</span> could not be found.
              </p>
              <Link to="/parks">
                <Button variant="secondary" size="sm" className="mt-4">
                  Browse Parks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render park details
  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Link to="/parks">
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
            Back to Parks
          </Button>
        </Link>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Park info card */}
        <ParkInfoCard park={park} />

        {/* Mini map */}
        <div className="h-[400px] lg:h-auto">
          <ParkMiniMap park={park} />
        </div>
      </div>
    </div>
  );
}
