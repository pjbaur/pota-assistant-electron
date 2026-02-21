import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui';
import { ParkMap } from '../components/parks';
import { useParks } from '../hooks/use-parks';
import type { Park } from '@shared/types';

type ViewMode = 'list' | 'map';

export function Parks(): JSX.Element {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const {
    parks,
    selectedPark,
    isLoading,
    error,
    searchParks,
    selectPark,
  } = useParks({ autoFetch: true });

  const handleSearch = useCallback(
    (query: string) => {
      void searchParks({ query });
    },
    [searchParks]
  );

  const handleSelectPark = useCallback(
    (park: Park) => {
      selectPark(park);
      navigate(`/parks/${park.reference}`);
    },
    [selectPark, navigate]
  );

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Parks
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Discover and explore POTA parks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
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
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                List
              </span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
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
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                Map
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <Input
          placeholder="Search parks by name, reference, or location..."
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
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600 dark:bg-error-600/10 dark:text-error-400">
          {error}
        </div>
      )}

      {viewMode === 'map' ? (
        <div className="flex-1 overflow-hidden rounded-xl shadow-sm">
          <ParkMap
            parks={parks}
            selectedPark={selectedPark}
            onSelectPark={handleSelectPark}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Searching parks...
                </p>
              </div>
            </div>
          ) : parks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {parks.map((park) => (
                <button
                  key={park.reference}
                  onClick={() => handleSelectPark(park)}
                  className="rounded-lg border border-slate-200 p-4 text-left transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:hover:border-primary-500"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      {park.reference}
                    </span>
                    {park.isFavorite && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-warning-500"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-slate-900 dark:text-white">
                    {park.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{park.entityId}</span>
                    {park.gridSquare && (
                      <>
                        <span>·</span>
                        <span>{park.gridSquare}</span>
                      </>
                    )}
                  </div>
                  {park.activationCount > 0 && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {park.activationCount.toLocaleString()} activations
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
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
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  No Parks Found
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Try adjusting your search or sync parks from Settings.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
