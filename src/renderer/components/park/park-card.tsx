import { useCallback } from 'react';
import { useIPC } from '../../hooks/use-ipc';
import { useParkStore } from '../../stores/park-store';
import { useUIStore } from '../../stores/ui-store';
import { Tooltip } from '../ui';
import type { Park } from '@shared/types';

export interface ParkCardProps {
  park: Park;
  onClick: (park: Park) => void;
}

/**
 * Get program name from program ID
 */
function getProgramName(programId: string): string {
  const programs: Record<string, string> = {
    NPS: 'National Park Service',
    SP: 'State Park',
    USFS: 'US Forest Service',
    BLM: 'Bureau of Land Management',
    USFWS: 'US Fish & Wildlife Service',
    COE: 'Army Corps of Engineers',
    TVA: 'Tennessee Valley Authority',
    ARC: 'Appalachian Trail',
    RVR: 'River',
    LKE: 'Lake',
    WMA: 'Wildlife Management Area',
    OTH: 'Other',
  };
  return programs[programId] ?? programId;
}

/**
 * Format coordinates for display
 */
function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat);
  const absLng = Math.abs(lng);
  return `${absLat.toFixed(4)}° ${latDir}, ${absLng.toFixed(4)}° ${lngDir}`;
}

export function ParkCard({ park, onClick }: ParkCardProps): JSX.Element {
  const { invoke } = useIPC();
  const { toggleFavorite: toggleFavoriteInStore, favorites } = useParkStore();
  const { addToast } = useUIStore();

  const isFavorite = favorites.includes(park.reference);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      void (async () => {
        toggleFavoriteInStore(park.reference);
        const result = await invoke('parks:favorite:toggle', {
          reference: park.reference,
        });
        if (result.success && result.data) {
          addToast({
            title: result.data.isFavorite
              ? 'Added to favorites'
              : 'Removed from favorites',
            description: park.name,
            variant: 'success',
          });
        }
      })();
    },
    [park.reference, park.name, toggleFavoriteInStore, invoke, addToast]
  );

  return (
    <button
      onClick={() => onClick(park)}
      className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-500"
    >
      {/* Header with reference and favorite toggle */}
      <div className="mb-2 flex items-start justify-between">
        <span className="inline-flex items-center rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          {park.reference}
        </span>
        <Tooltip
          content={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <button
            onClick={handleToggleFavorite}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-yellow-500 group-hover:text-slate-500 dark:hover:bg-slate-700"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isFavorite ? 'text-yellow-500' : ''}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Park name */}
      <h3 className="mb-1 line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
        {park.name}
      </h3>

      {/* Program type */}
      <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
        {getProgramName(park.programId)}
      </div>

      {/* Location info */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          {park.entityId}
        </span>
        {park.gridSquare && (
          <>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="font-mono">{park.gridSquare}</span>
          </>
        )}
      </div>

      {/* Footer with coordinates and activation count */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <span className="truncate">{formatCoordinates(park.latitude, park.longitude)}</span>
        {park.activationCount > 0 && (
          <span className="ml-2 flex-shrink-0">
            {park.activationCount.toLocaleString()} activations
          </span>
        )}
      </div>
    </button>
  );
}
