import { useState, useCallback } from 'react';
import { MapContainerComponent } from '../components/map';
import { ParkCard, ParkDetail, ParkSearch } from '../components/park';
import { useParks } from '../hooks/use-parks';
import type { Park } from '@shared/types';

type ViewMode = 'list' | 'map';

export function Parks(): JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const {
    parks,
    selectedPark,
    filters,
    isLoading,
    error,
    totalResults,
    searchParks,
    selectPark,
    clearFilters,
  } = useParks({ autoFetch: true });

  const handleSearch = useCallback(
    (newFilters: Partial<typeof filters>) => {
      void searchParks(newFilters);
    },
    [searchParks]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const handleSelectPark = useCallback(
    (park: Park) => {
      selectPark(park);
      setShowDetailPanel(true);
    },
    [selectPark]
  );

  const handleCloseDetail = useCallback(() => {
    setShowDetailPanel(false);
    selectPark(null);
  }, [selectPark]);

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
        {/* Header */}
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
            {/* Results count */}
            {!isLoading && totalResults > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {totalResults.toLocaleString()} parks
              </span>
            )}

            {/* View mode toggle */}
            <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                aria-label="List view"
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
                aria-label="Map view"
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

        {/* Search bar */}
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <ParkSearch
            filters={filters}
            onSearch={handleSearch}
            onClear={handleClearFilters}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600 dark:bg-error-600/10 dark:text-error-400">
            {error}
          </div>
        )}

        {/* Main view */}
        {viewMode === 'map' ? (
          <div className="flex-1 overflow-hidden rounded-xl shadow-sm">
            <MapContainerComponent
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
                  <ParkCard
                    key={park.reference}
                    park={park}
                    onClick={handleSelectPark}
                  />
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

      {/* Detail side panel */}
      {showDetailPanel && selectedPark && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={handleCloseDetail}
          />

          {/* Side panel */}
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md lg:relative lg:z-auto lg:w-[400px] lg:flex-shrink-0">
            <ParkDetail park={selectedPark} onClose={handleCloseDetail} />
          </div>
        </>
      )}
    </div>
  );
}
