import { useCallback } from 'react';
import type { EquipmentPreset } from '@shared/types';

// Hardcoded equipment presets as specified
const PRESETS: EquipmentPreset[] = [
  {
    id: 'qrp-portable',
    name: 'QRP Portable (≤5W)',
    radio: 'Portable QRP Radio',
    antenna: 'Wire Antenna',
    powerWatts: 5,
    mode: 'SSB/CW',
    notes: 'Lightweight field operation',
  },
  {
    id: 'standard-portable',
    name: 'Standard Portable (20-30W)',
    radio: 'Portable Radio',
    antenna: 'Vertical/Dipole',
    powerWatts: 25,
    mode: 'SSB',
    notes: 'Balanced power and portability',
  },
  {
    id: 'mobile-high',
    name: 'Mobile/High Power (≥50W)',
    radio: 'Mobile Radio',
    antenna: 'Mobile Antenna',
    powerWatts: 50,
    mode: 'SSB',
    notes: 'Maximum power from vehicle',
  },
];

export interface StepEquipmentProps {
  selectedPreset: EquipmentPreset | null;
  onPresetSelect: (preset: EquipmentPreset) => void;
}

export function StepEquipment({ selectedPreset, onPresetSelect }: StepEquipmentProps): JSX.Element {
  const handlePresetClick = useCallback(
    (preset: EquipmentPreset) => {
      onPresetSelect(preset);
    },
    [onPresetSelect]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Equipment Preset</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Select an equipment configuration for this activation
        </p>
      </div>

      <div className="space-y-3">
        {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                selectedPreset?.id === preset.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{preset.name}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {preset.radio} - {preset.antenna}
                  </div>
                </div>
                {selectedPreset?.id === preset.id && (
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
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>{preset.powerWatts}W</span>
                <span>{preset.mode}</span>
              </div>
              {preset.notes && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {preset.notes}
                </div>
              )}
            </button>
          ))}
        </div>

      {selectedPreset && (
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
                {selectedPreset.name}
              </div>
              <div className="mt-1 text-sm text-success-700 dark:text-success-300">
                {selectedPreset.radio} / {selectedPreset.antenna} / {selectedPreset.powerWatts}W /{' '}
                {selectedPreset.mode}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
