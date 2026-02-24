import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapContainerComponent } from '../components/map';
import { ParkCard, ParkDetail, ParkSearch } from '../components/park';
import { useParks, usePark } from '../hooks/use-parks';
import type { Park } from '@shared/types';

type ViewMode = 'list' | 'map';

export function Parks(): JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const {
    parks,
    selectedPark: selectedParkFromSearch,
    filters,
    isLoading,
    error,
    favorites,
    searchParks,
    selectPark: selectParkFromSearch,
    clearFilters,
  } = useParks({ autoFetch: true });

  // Fetch full park details (including timezone) when a park is selected
  const {
    park: selectedParkWithDetails,
    fetchPark,
  } = usePark(selectedParkFromSearch?.reference ?? null);

  // Fetch full details when park selection changes
  useEffect(() => {
    if (selectedParkFromSearch?.reference) {
      void fetchPark();
    }
  }, [selectedParkFromSearch?.reference, fetchPark]);

  // Use the full details if available, otherwise fall back to search result
  const selectedPark = selectedParkWithDetails ?? selectedParkFromSearch;

  // Filter parks by favorites when showOnlyFavorites is enabled
  const displayedParks = useMemo(() => {
    if (!showOnlyFavorites) {
      return parks;
    }
    return parks.filter((park) => favorites.includes(park.reference));
  }, [parks, favorites, showOnlyFavorites]);

  const selectPark = useCallback(
    (park: Park | null) => {
      selectParkFromSearch(park);
    },
    [selectParkFromSearch]
  );

  const handleSearch = useCallback(
    (newFilters: Partial<typeof filters>) => {
      void searchParks(newFilters);
    },
    [searchParks]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setShowOnlyFavorites(false);
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

  const handleToggleFavorites = useCallback(() => {
    setShowOnlyFavorites((prev) => !prev);
  }, []);

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
            {!isLoading && displayedParks.length > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {displayedParks.length.toLocaleString()} {displayedParks.length === 1 ? 'park' : 'parks'}
                {showOnlyFavorites && ' (favorites)'}
              </span>
            )}

            {/* Favorites toggle */}
            <button
              onClick={handleToggleFavorites}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                showOnlyFavorites
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-white'
              }`}
              aria-label={showOnlyFavorites ? 'Show all parks' : 'Show only favorites'}
              title={showOnlyFavorites ? 'Show all parks' : 'Show only favorites'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={showOnlyFavorites ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="hidden sm:inline">Favorites</span>
              {favorites.length > 0 && (
                <span className="rounded-full bg-amber-200 px-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-800 dark:text-amber-200">
                  {favorites.length}
                </span>
              )}
            </button>

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
              parks={displayedParks}
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
            ) : showOnlyFavorites && favorites.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
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
                      className="text-amber-500"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                    No Favorites Yet
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Star parks to add them to your favorites for quick access.
                  </p>
                  <button
                    onClick={handleToggleFavorites}
                    className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Show all parks
                  </button>
                </div>
              </div>
            ) : displayedParks.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedParks.map((park) => (
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
