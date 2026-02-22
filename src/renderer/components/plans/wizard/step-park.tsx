import { useState, useCallback, useEffect } from 'react';
import { Input } from '../../ui';
import { useParks } from '../../../hooks/use-parks';
import type { Park } from '@shared/types';

export interface StepParkProps {
  selectedPark: Park | null;
  onParkSelect: (park: Park) => void;
}

export function StepPark({ selectedPark, onParkSelect }: StepParkProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const { parks, favorites, isLoading, error, searchParks } = useParks();

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        void searchParks({ query: searchQuery });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchParks]);

  const handleParkClick = useCallback(
    (park: Park) => {
      onParkSelect(park);
    },
    [onParkSelect]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select a Park</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Search for a POTA park by name or reference (e.g., &quot;K-0039&quot; or &quot;Yellowstone&quot;)
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Search Parks"
          placeholder="Enter park name or reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600 dark:bg-error-900/20 dark:text-error-400">
            {error}
          </div>
        )}

        {!isLoading && !error && parks.length === 0 && searchQuery.trim().length >= 2 && (
          <div className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">
            No parks found matching &quot;{searchQuery}&quot;
          </div>
        )}

        {!isLoading && !error && parks.length > 0 && (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {parks.map((park) => (
              <button
                key={park.reference}
                type="button"
                onClick={() => handleParkClick(park)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  selectedPark?.reference === park.reference
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{park.name}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {park.reference} - {park.entityId}
                    </div>
                  </div>
                  {favorites.includes(park.reference) && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-yellow-500"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>Grid: {park.gridSquare}</span>
                  <span>Activations: {park.activationCount}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPark && (
        <div className="rounded-lg border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20">
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
              className="mt-0.5 text-success-600 dark:text-success-400"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <div className="font-medium text-success-900 dark:text-success-100">
                {selectedPark.name}
              </div>
              <div className="mt-1 text-sm text-success-700 dark:text-success-300">
                {selectedPark.reference} - {selectedPark.gridSquare}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
