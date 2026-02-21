import { useCallback } from 'react';
import type { Park, EquipmentPreset, BandId } from '@shared/types';
import type { WizardStep } from '../../../stores/plan-store';
import type { DateTimeData } from './step-datetime';

export interface StepReviewProps {
  park: Park | null;
  datetime: DateTimeData;
  equipment: EquipmentPreset | null;
  bands: BandId[];
  notes: string;
  onNotesChange: (notes: string) => void;
  onEditStep: (step: WizardStep) => void;
}

export function StepReview({
  park,
  datetime,
  equipment,
  bands,
  notes,
  onNotesChange,
  onEditStep,
}: StepReviewProps): JSX.Element {
  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onNotesChange(e.target.value);
    },
    [onNotesChange]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Review Your Plan</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Review your activation details before creating the plan
        </p>
      </div>

      <div className="space-y-4">
        {/* Park Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
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
                  className="text-primary-600 dark:text-primary-400"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Park</div>
                {park ? (
                  <>
                    <div className="font-medium text-slate-900 dark:text-white">{park.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {park.reference} - Grid: {park.gridSquare}
                    </div>
                  </>
                ) : (
                  <div className="text-error-600 dark:text-error-400">No park selected</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep('park')}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
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
                  className="text-primary-600 dark:text-primary-400"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Date & Time
                </div>
                {datetime.date ? (
                  <>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {new Date(datetime.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {datetime.startTime} - {datetime.endTime}
                    </div>
                  </>
                ) : (
                  <div className="text-error-600 dark:text-error-400">No date selected</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep('datetime')}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Equipment Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
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
                  className="text-primary-600 dark:text-primary-400"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9" y1="1" x2="9" y2="4" />
                  <line x1="15" y1="1" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="23" />
                  <line x1="15" y1="20" x2="15" y2="23" />
                  <line x1="20" y1="9" x2="23" y2="9" />
                  <line x1="20" y1="14" x2="23" y2="14" />
                  <line x1="1" y1="9" x2="4" y2="9" />
                  <line x1="1" y1="14" x2="4" y2="14" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Equipment
                </div>
                {equipment ? (
                  <>
                    <div className="font-medium text-slate-900 dark:text-white">{equipment.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {equipment.radio} / {equipment.antenna} / {equipment.powerWatts}W /{' '}
                      {equipment.mode}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-600 dark:text-slate-400">No equipment selected</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep('equipment')}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Bands Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
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
                  className="text-primary-600 dark:text-primary-400"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Bands</div>
                {bands.length > 0 ? (
                  <>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {bands.length} {bands.length === 1 ? 'band' : 'bands'} selected
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {bands.join(', ')}
                    </div>
                  </>
                ) : (
                  <div className="text-error-600 dark:text-error-400">No bands selected</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep('bands')}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Notes Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
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
                className="text-primary-600 dark:text-primary-400"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="flex-1">
              <label
                htmlFor="notes"
                className="mb-1.5 block text-sm font-medium text-slate-500 dark:text-slate-400"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={handleNotesChange}
                placeholder="Add any additional notes for your activation..."
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
