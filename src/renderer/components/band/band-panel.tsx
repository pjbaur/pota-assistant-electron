/**
 * Band Panel Component
 *
 * Displays a 24-hour timeline with band conditions for POTA activation planning.
 * Color-codes conditions: green=excellent, yellow=good, orange=fair, red=poor
 */

import { useMemo } from 'react';
import type { DayBandForecast, BandCondition } from '@shared/types/band-types';

/** Props for the BandPanel component */
interface BandPanelProps {
  /** Band forecast data */
  recommendations: DayBandForecast;
  /** Optional list of planned bands to highlight matches */
  plannedBands?: string[];
}

/** Band condition to CSS class mapping */
const CONDITION_COLORS: Record<BandCondition, string> = {
  excellent: 'bg-green-500',
  good: 'bg-yellow-500',
  fair: 'bg-orange-500',
  poor: 'bg-red-900',
};

/** Band condition to text color for dark backgrounds */
const CONDITION_TEXT_COLORS: Record<BandCondition, string> = {
  excellent: 'text-white',
  good: 'text-black',
  fair: 'text-white',
  poor: 'text-white',
};

/** All bands to display in the timeline */
const DISPLAY_BANDS = ['160m', '80m', '60m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m'];

/**
 * Get the current hour (0-23) in local time
 */
function getCurrentHour(): number {
  return new Date().getHours();
}

/**
 * Band Panel - Shows 24-hour timeline with band conditions
 */
export function BandPanel({ recommendations, plannedBands = [] }: BandPanelProps): JSX.Element {
  const currentHour = getCurrentHour();

  // Build a map of hour -> band -> condition for quick lookup
  const conditionMap = useMemo(() => {
    const map = new Map<number, Map<string, BandCondition>>();
    for (const hourly of recommendations.hourByHour) {
      const hourMap = new Map<string, BandCondition>();
      for (const band of Object.keys(hourly.conditions)) {
        const cond = hourly.conditions[band];
        if (cond !== undefined) {
          hourMap.set(band, cond);
        }
      }
      map.set(hourly.hour, hourMap);
    }
    return map;
  }, [recommendations]);

  // Get bands that appear in recommendations (sorted by best condition)
  const recommendedBands = useMemo(() => {
    return recommendations.recommendations.map(r => r.band);
  }, [recommendations]);

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Band Conditions - {recommendations.date}
      </h3>

      {/* Timeline Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-slate-800 text-left text-xs text-slate-400 p-1 z-10">
                Band
              </th>
              {/* Hour headers */}
              {Array.from({ length: 24 }, (_, hour) => (
                <th
                  key={hour}
                  className={`text-xs p-1 min-w-[28px] ${
                    hour === currentHour
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {hour.toString().padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DISPLAY_BANDS.map((band) => {
              // Check if this band is in the user's planned bands
              const isPlanned = plannedBands.includes(band);
              // Check if this band is recommended
              const isRecommended = recommendedBands.includes(band);

              // Skip bands that are neither planned nor recommended
              if (!isPlanned && !isRecommended) {
                // Still show but dimmed
              }

              return (
                <tr
                  key={band}
                  className={`${
                    isPlanned ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <td
                    className={`sticky left-0 bg-slate-800 text-sm font-medium p-1 z-10 ${
                      isPlanned
                        ? 'text-blue-400'
                        : isRecommended
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {band}
                    {isPlanned && (
                      <span className="ml-1 text-xs text-blue-400">*</span>
                    )}
                  </td>
                  {/* Hour cells */}
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourConditions = conditionMap.get(hour);
                    const condition = hourConditions?.get(band) ?? 'poor';

                    return (
                      <td
                        key={hour}
                        className={`p-0.5 ${
                          hour === currentHour ? 'ring-1 ring-blue-400' : ''
                        }`}
                      >
                        <div
                          className={`w-full h-5 rounded-sm flex items-center justify-center text-[10px] ${CONDITION_COLORS[condition]} ${CONDITION_TEXT_COLORS[condition]}`}
                          title={`${band} at ${hour}:00 - ${condition}`}
                        >
                          {/* Show first letter of condition for accessibility */}
                          {condition.charAt(0).toUpperCase()}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <span className="text-slate-400">Conditions:</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 rounded-sm ${CONDITION_COLORS.excellent}`} />
          <span>Excellent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 rounded-sm ${CONDITION_COLORS.good}`} />
          <span>Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 rounded-sm ${CONDITION_COLORS.fair}`} />
          <span>Fair</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 rounded-sm ${CONDITION_COLORS.poor}`} />
          <span>Poor</span>
        </div>
        {plannedBands.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-blue-400">*</span>
            <span>= Planned</span>
          </div>
        )}
      </div>

      {/* Top Recommendations */}
      {recommendations.recommendations.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-white mb-2">
            Top Recommendations
          </h4>
          <div className="space-y-2">
            {recommendations.recommendations.slice(0, 5).map((rec) => (
              <div
                key={rec.band}
                className={`p-2 rounded ${
                  plannedBands.includes(rec.band)
                    ? 'bg-blue-900/30 border border-blue-500/50'
                    : 'bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{rec.band}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      CONDITION_COLORS[rec.condition]
                    } ${CONDITION_TEXT_COLORS[rec.condition]}`}
                  >
                    {rec.condition}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{rec.reason}</p>
                {rec.timeSlots.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rec.timeSlots.map((slot, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-600 px-1.5 py-0.5 rounded"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
