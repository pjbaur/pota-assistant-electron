import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip } from '../ui';
import { useIPC } from '../../hooks/use-ipc';
import { useParkStore } from '../../stores/park-store';
import { useUIStore } from '../../stores/ui-store';
import type { Park } from '@shared/types';

/**
 * Format timezone for display
 */
function formatTimezone(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(new Date());
    const tzNamePart = parts.find((p) => p.type === 'timeZoneName');
    const abbreviation = tzNamePart?.value ?? '';

    // Get city name from IANA identifier
    const cityPart = timezone.split('/').pop()?.replace(/_/g, ' ') ?? '';
    return `${cityPart} (${abbreviation})`;
  } catch {
    return timezone;
  }
}

export interface ParkDetailProps {
  park: Park;
  onClose?: () => void;
  onFavoriteChange?: () => void;
}

/**
 * Check if clipboard API is available and copy text
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch {
    return false;
  }
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

export function ParkDetail({ park, onClose, onFavoriteChange }: ParkDetailProps): JSX.Element {
  const navigate = useNavigate();
  const { invoke } = useIPC();
  const { toggleFavorite: toggleFavoriteInStore, favorites } = useParkStore();
  const { addToast } = useUIStore();

  const isFavorite = favorites.includes(park.reference);

  const handleCopyReference = useCallback(() => {
    void (async () => {
      const success = await copyToClipboard(park.reference);
      if (success) {
        addToast({
          title: 'Copied!',
          description: `Park reference ${park.reference} copied to clipboard`,
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Copy failed',
          description: 'Could not copy to clipboard',
          variant: 'error',
        });
      }
    })();
  }, [park.reference, addToast]);

  const handleToggleFavorite = useCallback(() => {
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
        onFavoriteChange?.();
      }
    })();
  }, [park.reference, park.name, toggleFavoriteInStore, invoke, addToast, onFavoriteChange]);

  const handleOpenInPota = useCallback(() => {
    void (async () => {
      const url = `https://pota.app/#/park/${park.reference}`;
      const result = await invoke('system:open:external', { url });
      if (!result.success) {
        addToast({
          title: 'Failed to open link',
          description: result.error ?? 'Could not open external URL',
          variant: 'error',
        });
      }
    })();
  }, [park.reference, invoke, addToast]);

  const handleCreatePlan = useCallback(() => {
    navigate(`/plans/new?park=${encodeURIComponent(park.reference)}`);
  }, [navigate, park.reference]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 p-4 dark:border-slate-700">
        <div className="flex-1 pr-4">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-primary-600 dark:text-primary-400">
              {park.reference}
            </span>
            <Tooltip content="Copy reference">
              <button
                onClick={handleCopyReference}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label="Copy park reference"
              >
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
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </Tooltip>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {park.name}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip
            content={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <button
              onClick={handleToggleFavorite}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-yellow-500 dark:hover:bg-slate-700"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Close panel"
            >
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Badges */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {getProgramName(park.programId)}
          </span>
          {park.activationCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-success-100 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-300">
              {park.activationCount.toLocaleString()}{' '}
              {park.activationCount === 1 ? 'activation' : 'activations'}
            </span>
          )}
          {isFavorite && (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
              Favorite
            </span>
          )}
        </div>

        {/* Location Details */}
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
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
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Coordinates
            </div>
            <div className="font-mono text-sm text-slate-900 dark:text-white">
              {formatCoordinates(park.latitude, park.longitude)}
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
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
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Grid Square
            </div>
            <div className="font-mono text-sm text-slate-900 dark:text-white">
              {park.gridSquare}
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
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
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Entity / Country
            </div>
            <div className="text-sm text-slate-900 dark:text-white">
              {park.entityId}
            </div>
          </div>

          {park.timezone && (
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
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
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Timezone
              </div>
              <div className="text-sm text-slate-900 dark:text-white">
                {formatTimezone(park.timezone)}
              </div>
            </div>
          )}

          {park.lastActivation && (
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
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
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Last Activation
              </div>
              <div className="text-sm text-slate-900 dark:text-white">
                {new Date(park.lastActivation).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-700">
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleCreatePlan}
            className="w-full"
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            }
          >
            Create Plan
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleOpenInPota}
            className="w-full"
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            }
          >
            View on POTA.app
          </Button>
        </div>
      </div>
    </div>
  );
}
