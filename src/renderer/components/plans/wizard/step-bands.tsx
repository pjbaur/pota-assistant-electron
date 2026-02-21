import { useCallback } from 'react';
import type { BandId } from '@shared/types';

export interface StepBandsProps {
  selectedBands: BandId[];
  onBandsChange: (bands: BandId[]) => void;
}

// Standard amateur radio bands for POTA
export const AVAILABLE_BANDS: { id: BandId; label: string; frequency: string }[] = [
  { id: '80m', label: '80m', frequency: '3.5-4.0 MHz' },
  { id: '60m', label: '60m', frequency: '5.3-5.4 MHz' },
  { id: '40m', label: '40m', frequency: '7.0-7.3 MHz' },
  { id: '30m', label: '30m', frequency: '10.1-10.15 MHz' },
  { id: '20m', label: '20m', frequency: '14.0-14.35 MHz' },
  { id: '17m', label: '17m', frequency: '18.0-18.17 MHz' },
  { id: '15m', label: '15m', frequency: '21.0-21.45 MHz' },
  { id: '12m', label: '12m', frequency: '24.9-24.99 MHz' },
  { id: '10m', label: '10m', frequency: '28.0-29.7 MHz' },
  { id: '6m', label: '6m', frequency: '50-54 MHz' },
  { id: '2m', label: '2m', frequency: '144-148 MHz' },
];

export function StepBands({ selectedBands, onBandsChange }: StepBandsProps): JSX.Element {
  const handleBandToggle = useCallback(
    (bandId: BandId) => {
      if (selectedBands.includes(bandId)) {
        onBandsChange(selectedBands.filter((b) => b !== bandId));
      } else {
        onBandsChange([...selectedBands, bandId]);
      }
    },
    [selectedBands, onBandsChange]
  );

  const handleSelectAll = useCallback(() => {
    onBandsChange(AVAILABLE_BANDS.map((b) => b.id));
  }, [onBandsChange]);

  const handleClearAll = useCallback(() => {
    onBandsChange([]);
  }, [onBandsChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Band Selection</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Select the bands you plan to operate on during this activation
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Select All
        </button>
        <span className="text-slate-400">|</span>
        <button
          type="button"
          onClick={handleClearAll}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {AVAILABLE_BANDS.map((band) => {
          const isSelected = selectedBands.includes(band.id);

          return (
            <button
              key={band.id}
              type="button"
              onClick={() => handleBandToggle(band.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-medium ${
                    isSelected
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {band.label}
                </span>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    isSelected
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{band.frequency}</div>
            </button>
          );
        })}
      </div>

      {selectedBands.length === 0 && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
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
              className="mt-0.5 text-warning-600 dark:text-warning-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="text-sm text-warning-800 dark:text-warning-200">
              Please select at least one band to continue.
            </div>
          </div>
        </div>
      )}

      {selectedBands.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
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
              className="mt-0.5 text-primary-600 dark:text-primary-400"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                {selectedBands.length} {selectedBands.length === 1 ? 'band' : 'bands'} selected
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {selectedBands.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
