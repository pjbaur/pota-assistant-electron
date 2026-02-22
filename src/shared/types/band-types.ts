/**
 * Band recommendation types for POTA Activation Planner
 *
 * These types support heuristic-based band condition predictions
 * for amateur radio propagation planning.
 */

/** Band condition quality rating */
export type BandCondition = 'excellent' | 'good' | 'fair' | 'poor';

/** Individual band recommendation with time slots and reasoning */
export interface BandRecommendation {
  /** Band identifier (e.g., '40m', '20m') */
  band: string;
  /** Overall condition quality for this band */
  condition: BandCondition;
  /** Recommended operating time slots (e.g., ['06:00-10:00', '18:00-22:00']) */
  timeSlots: string[];
  /** Explanation for the recommendation */
  reason: string;
}

/** Hourly band condition detail */
export interface HourlyBandCondition {
  /** Hour of day (0-23) */
  hour: number;
  /** Best bands for this hour, in order of preference */
  bestBands: string[];
  /** Condition by band for this hour */
  conditions: Record<string, BandCondition>;
}

/** Complete day forecast for band conditions */
export interface DayBandForecast {
  /** ISO date string for this forecast */
  date: string;
  /** Band recommendations with time slots */
  recommendations: BandRecommendation[];
  /** Hour-by-hour conditions for all bands */
  hourByHour: HourlyBandCondition[];
}
