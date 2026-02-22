/**
 * Band Recommendations Service
 *
 * Provides heuristic-based band condition predictions for amateur radio
 * propagation planning. Uses time-of-day and seasonal patterns to estimate
 * band conditions for POTA activations.
 *
 * Note: These are general heuristics, not real propagation data.
 * For actual conditions, operators should consult propagation tools
 * like VOACAP, WSPRnet, or real-time MUF maps.
 */

import type {
  BandCondition,
  BandRecommendation,
  HourlyBandCondition,
  DayBandForecast,
} from '../../shared/types/band-types';

/** All amateur bands commonly used for POTA activations */
const ALL_BANDS = ['160m', '80m', '60m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m'] as const;

/** Season multiplier for band conditions */
type Season = 'winter' | 'spring' | 'summer' | 'fall';

/**
 * Get the season for a given date in the northern hemisphere
 */
function getSeason(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Base band conditions by time period
 *
 * Time periods:
 * - Early Morning (0-5): Night conditions
 * - Morning (6-9): NVIS, short skip on low bands
 * - Late Morning (10-12): Transition to daytime bands
 * - Midday (13-16): F2 layer optimal for high bands
 * - Late Afternoon (17-19): Gray line, transition
 * - Evening (20-22): Gray line, good low band opening
 * - Late Night (23): Night conditions returning
 */
const BASE_CONDITIONS: Record<number, Record<string, BandCondition>> = {
  // Early Morning (0-5): Night conditions
  0: { '160m': 'fair', '80m': 'fair', '60m': 'fair', '40m': 'poor', '30m': 'poor', '20m': 'poor', '17m': 'poor', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },
  1: { '160m': 'fair', '80m': 'fair', '60m': 'fair', '40m': 'poor', '30m': 'poor', '20m': 'poor', '17m': 'poor', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },
  2: { '160m': 'fair', '80m': 'fair', '60m': 'fair', '40m': 'poor', '30m': 'poor', '20m': 'poor', '17m': 'poor', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },
  3: { '160m': 'fair', '80m': 'fair', '60m': 'fair', '40m': 'poor', '30m': 'poor', '20m': 'poor', '17m': 'poor', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },
  4: { '160m': 'fair', '80m': 'fair', '60m': 'fair', '40m': 'poor', '30m': 'poor', '20m': 'poor', '17m': 'poor', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },
  5: { '160m': 'fair', '80m': 'fair', '60m': 'fair', '40m': 'poor', '30m': 'poor', '20m': 'poor', '17m': 'poor', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },

  // Morning (6-9): NVIS, short skip excellent
  6: { '160m': 'poor', '80m': 'excellent', '60m': 'excellent', '40m': 'excellent', '30m': 'good', '20m': 'fair', '17m': 'poor', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },
  7: { '160m': 'poor', '80m': 'excellent', '60m': 'excellent', '40m': 'excellent', '30m': 'good', '20m': 'good', '17m': 'fair', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'fair' },
  8: { '160m': 'poor', '80m': 'good', '60m': 'good', '40m': 'excellent', '30m': 'good', '20m': 'good', '17m': 'fair', '15m': 'fair', '12m': 'poor', '10m': 'poor', '6m': 'fair' },
  9: { '160m': 'poor', '80m': 'good', '60m': 'good', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'good', '15m': 'fair', '12m': 'fair', '10m': 'fair', '6m': 'fair' },

  // Late Morning (10-12): Transition
  10: { '160m': 'poor', '80m': 'fair', '60m': 'good', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'good', '12m': 'fair', '10m': 'fair', '6m': 'good' },
  11: { '160m': 'poor', '80m': 'fair', '60m': 'fair', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'excellent', '12m': 'good', '10m': 'good', '6m': 'good' },
  12: { '160m': 'poor', '80m': 'poor', '60m': 'fair', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'excellent', '12m': 'good', '10m': 'good', '6m': 'good' },

  // Midday (13-16): F2 layer optimal
  13: { '160m': 'poor', '80m': 'poor', '60m': 'fair', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'excellent', '12m': 'excellent', '10m': 'excellent', '6m': 'excellent' },
  14: { '160m': 'poor', '80m': 'poor', '60m': 'fair', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'excellent', '12m': 'excellent', '10m': 'excellent', '6m': 'excellent' },
  15: { '160m': 'poor', '80m': 'poor', '60m': 'fair', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'excellent', '12m': 'excellent', '10m': 'excellent', '6m': 'excellent' },
  16: { '160m': 'poor', '80m': 'poor', '60m': 'fair', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'excellent', '12m': 'excellent', '10m': 'excellent', '6m': 'good' },

  // Late Afternoon (17-19): Transition, gray line
  17: { '160m': 'poor', '80m': 'fair', '60m': 'good', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'good', '12m': 'good', '10m': 'good', '6m': 'fair' },
  18: { '160m': 'fair', '80m': 'good', '60m': 'good', '40m': 'excellent', '30m': 'good', '20m': 'excellent', '17m': 'good', '15m': 'good', '12m': 'fair', '10m': 'fair', '6m': 'poor' },
  19: { '160m': 'fair', '80m': 'excellent', '60m': 'good', '40m': 'excellent', '30m': 'good', '20m': 'good', '17m': 'fair', '15m': 'fair', '12m': 'poor', '10m': 'poor', '6m': 'poor' },

  // Evening (20-22): Gray line, low bands opening
  20: { '160m': 'fair', '80m': 'excellent', '60m': 'excellent', '40m': 'excellent', '30m': 'good', '20m': 'good', '17m': 'fair', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },
  21: { '160m': 'fair', '80m': 'excellent', '60m': 'excellent', '40m': 'excellent', '30m': 'good', '20m': 'good', '17m': 'fair', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },
  22: { '160m': 'fair', '80m': 'good', '60m': 'good', '40m': 'good', '30m': 'fair', '20m': 'fair', '17m': 'poor', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },

  // Late Night (23): Night conditions returning
  23: { '160m': 'fair', '80m': 'fair', '60m': 'fair', '40m': 'poor', '30m': 'poor', '20m': 'poor', '17m': 'poor', '15m': 'poor', '12m': 'poor', '10m': 'poor', '6m': 'poor' },
};

/** Seasonal adjustments for bands */
const SEASON_ADJUSTMENTS: Record<Season, Record<string, BandCondition>> = {
  winter: { '160m': 'good', '80m': 'excellent', '60m': 'excellent', '40m': 'excellent', '30m': 'good', '20m': 'good', '17m': 'good', '15m': 'fair', '12m': 'fair', '10m': 'poor', '6m': 'poor' },
  spring: { '160m': 'fair', '80m': 'good', '60m': 'good', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'good', '12m': 'good', '10m': 'fair', '6m': 'fair' },
  summer: { '160m': 'poor', '80m': 'fair', '60m': 'fair', '40m': 'good', '30m': 'good', '20m': 'excellent', '17m': 'excellent', '15m': 'excellent', '12m': 'excellent', '10m': 'excellent', '6m': 'excellent' },
  fall: { '160m': 'fair', '80m': 'good', '60m': 'good', '40m': 'excellent', '30m': 'good', '20m': 'excellent', '17m': 'good', '15m': 'good', '12m': 'fair', '10m': 'fair', '6m': 'good' },
};

/**
 * Condition ranking for sorting (higher is better)
 */
const CONDITION_RANK: Record<BandCondition, number> = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
};

/**
 * Get the better of two conditions
 */
function betterCondition(a: BandCondition, b: BandCondition): BandCondition {
  return CONDITION_RANK[a] >= CONDITION_RANK[b] ? a : b;
}

/**
 * Apply seasonal adjustment to a base condition
 */
function applySeasonalAdjustment(
  base: BandCondition,
  seasonal: BandCondition
): BandCondition {
  // If seasonal is better than base, upgrade one level
  // If seasonal is worse, downgrade one level
  const baseRank = CONDITION_RANK[base];
  const seasonalRank = CONDITION_RANK[seasonal];

  // Blend: if seasonal is significantly different, adjust
  if (seasonalRank - baseRank >= 2) {
    // Upgrade by one level
    if (base === 'poor') return 'fair';
    if (base === 'fair') return 'good';
    if (base === 'good') return 'excellent';
  } else if (baseRank - seasonalRank >= 2) {
    // Downgrade by one level
    if (base === 'excellent') return 'good';
    if (base === 'good') return 'fair';
    if (base === 'fair') return 'poor';
  }

  return base;
}

/**
 * Get hour-by-hour band conditions for a date
 */
export function getHourlyConditions(
  date: Date,
  hour: number
): HourlyBandCondition {
  const season = getSeason(date);
  const seasonalAdj = SEASON_ADJUSTMENTS[season];
  const baseConditions = BASE_CONDITIONS[hour] ?? BASE_CONDITIONS[0];

  // Apply seasonal adjustments
  const conditions: Record<string, BandCondition> = {};
  for (const band of ALL_BANDS) {
    const base = baseConditions[band] ?? 'poor';
    const seasonal = seasonalAdj[band] ?? 'fair';
    conditions[band] = applySeasonalAdjustment(base, seasonal);
  }

  // Determine best bands (excellent or good, sorted by condition)
  const bestBands = ALL_BANDS
    .filter(band => CONDITION_RANK[conditions[band]] >= 3) // good or excellent
    .sort((a, b) => CONDITION_RANK[conditions[b]] - CONDITION_RANK[conditions[a]]);

  return {
    hour,
    bestBands,
    conditions,
  };
}

/**
 * Generate band recommendations with time slots for a day
 */
export function getBandRecommendations(date: Date): DayBandForecast {
  const dateStr = date.toISOString().split('T')[0];

  // Get hourly conditions for all 24 hours
  const hourByHour: HourlyBandCondition[] = [];
  for (let hour = 0; hour < 24; hour++) {
    hourByHour.push(getHourlyConditions(date, hour));
  }

  // Generate recommendations per band
  const recommendations: BandRecommendation[] = [];

  for (const band of ALL_BANDS) {
    // Find hours where this band is good or excellent
    const goodHours: number[] = [];
    let bestCondition: BandCondition = 'poor';

    for (const hourly of hourByHour) {
      const condition = hourly.conditions[band];
      if (CONDITION_RANK[condition] >= 3) { // good or excellent
        goodHours.push(hourly.hour);
      }
      if (CONDITION_RANK[condition] > CONDITION_RANK[bestCondition]) {
        bestCondition = condition;
      }
    }

    // Skip bands that never reach at least fair
    if (bestCondition === 'poor') {
      continue;
    }

    // Convert hours to time slots (group consecutive hours)
    const timeSlots = hoursToTimeSlots(goodHours);

    // Generate reason
    const reason = generateBandReason(band, date);

    recommendations.push({
      band,
      condition: bestCondition,
      timeSlots,
      reason,
    });
  }

  // Sort recommendations by best condition first
  recommendations.sort((a, b) => {
    const conditionDiff = CONDITION_RANK[b.condition] - CONDITION_RANK[a.condition];
    if (conditionDiff !== 0) return conditionDiff;
    // Secondary sort by number of time slots
    return b.timeSlots.length - a.timeSlots.length;
  });

  return {
    date: dateStr,
    recommendations,
    hourByHour,
  };
}

/**
 * Convert array of hours to time slot strings
 */
function hoursToTimeSlots(hours: number[]): string[] {
  if (hours.length === 0) return [];

  const slots: string[] = [];
  let start = hours[0];
  let end = hours[0];

  for (let i = 1; i < hours.length; i++) {
    if (hours[i] === end + 1) {
      // Consecutive hour
      end = hours[i];
    } else {
      // Gap found, save current slot
      slots.push(`${String(start).padStart(2, '0')}:00-${String(end + 1).padStart(2, '0')}:00`);
      start = hours[i];
      end = hours[i];
    }
  }

  // Don't forget the last slot
  slots.push(`${String(start).padStart(2, '0')}:00-${String(end + 1).padStart(2, '0')}:00`);

  return slots;
}

/**
 * Generate a human-readable reason for a band recommendation
 */
function generateBandReason(band: string, date: Date): string {
  const season = getSeason(date);
  const hour = date.getHours();

  // Low bands (160m, 80m, 60m)
  if (['160m', '80m', '60m'].includes(band)) {
    if (season === 'winter') {
      return 'Good winter conditions for low bands, excellent for NVIS and regional contacts';
    }
    if (hour >= 18 || hour < 6) {
      return 'Nighttime propagation supports regional NVIS contacts';
    }
    return 'Good for short-skip and regional contacts during gray line';
  }

  // Mid bands (40m, 30m)
  if (['40m', '30m'].includes(band)) {
    if (hour >= 6 && hour < 10) {
      return 'Morning NVIS and short-skip conditions excellent';
    }
    if (hour >= 18 && hour < 22) {
      return 'Evening gray line provides excellent propagation';
    }
    return 'Reliable band for medium-range contacts throughout the day';
  }

  // High bands (20m, 17m, 15m)
  if (['20m', '17m', '15m'].includes(band)) {
    if (season === 'summer') {
      return 'Summer conditions favor high bands for DX contacts';
    }
    if (hour >= 10 && hour < 18) {
      return 'F2 layer propagation optimal for medium to long distance contacts';
    }
    return 'Good daytime band for regional to DX contacts';
  }

  // Very high bands (12m, 10m, 6m)
  if (['12m', '10m', '6m'].includes(band)) {
    if (season === 'summer' && hour >= 12 && hour < 18) {
      return 'Peak summer conditions - excellent for DX and possible sporadic-E';
    }
    if (hour >= 12 && hour < 18) {
      return 'Midday propagation may support DX contacts';
    }
    return 'Conditions marginal - watch for band openings';
  }

  return 'General propagation conditions support operation';
}
