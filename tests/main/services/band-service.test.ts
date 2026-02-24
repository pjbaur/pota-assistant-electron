import { describe, expect, it } from 'vitest';

import { getBandRecommendations, getHourlyConditions } from '../../../src/main/services/band-service';

describe('main/services/band-service', () => {
  describe('season detection via getHourlyConditions', () => {
    it('applies spring adjustments for March dates', () => {
      const march = getHourlyConditions(new Date('2026-03-15T12:00:00Z'), 14);

      expect(march.conditions['10m']).toBe('good');
    });

    it('applies summer adjustments for June dates', () => {
      const june = getHourlyConditions(new Date('2026-06-15T12:00:00Z'), 14);

      expect(june.conditions['10m']).toBe('excellent');
    });

    it('applies fall adjustments for September dates', () => {
      const september = getHourlyConditions(new Date('2026-09-15T12:00:00Z'), 18);

      expect(september.conditions['6m']).toBe('fair');
    });

    it('applies winter adjustments for December dates', () => {
      const december = getHourlyConditions(new Date('2026-12-15T12:00:00Z'), 2);

      expect(december.conditions['80m']).toBe('good');
    });
  });

  describe('getHourlyConditions', () => {
    it('returns strong low-band conditions during summer morning', () => {
      const result = getHourlyConditions(new Date('2026-06-15T07:00:00Z'), 7);

      expect(result.conditions['80m']).toBe('good');
      expect(result.conditions['60m']).toBe('good');
      expect(result.conditions['40m']).toBe('excellent');
    });

    it('returns excellent high-band conditions at summer midday', () => {
      const result = getHourlyConditions(new Date('2026-06-15T14:00:00Z'), 14);

      expect(result.conditions['20m']).toBe('excellent');
      expect(result.conditions['15m']).toBe('excellent');
      expect(result.conditions['10m']).toBe('excellent');
    });

    it('returns fair-to-good low-band night conditions in winter', () => {
      const result = getHourlyConditions(new Date('2026-12-15T02:00:00Z'), 2);

      expect(result.conditions['160m']).toBe('fair');
      expect(result.conditions['80m']).toBe('good');
    });

    it('filters bestBands to good or excellent only and sorts by rank', () => {
      const result = getHourlyConditions(new Date('2026-06-15T09:00:00Z'), 9);

      expect(result.bestBands.length).toBeGreaterThan(0);
      expect(result.bestBands.every((band) => {
        const condition = result.conditions[band];
        return condition === 'good' || condition === 'excellent';
      })).toBe(true);

      const first = result.bestBands[0];
      const last = result.bestBands[result.bestBands.length - 1];
      expect(first).toBeDefined();
      expect(last).toBeDefined();
      if (first !== undefined && last !== undefined) {
        const rank = { excellent: 4, good: 3, fair: 2, poor: 1 } as const;
        expect(rank[result.conditions[first]]).toBeGreaterThanOrEqual(rank[result.conditions[last]]);
      }
    });

    it('upgrades conditions when seasonal trend is significantly better', () => {
      const summer = getHourlyConditions(new Date('2026-06-15T09:00:00Z'), 9);

      expect(summer.conditions['10m']).toBe('good');
    });

    it('downgrades conditions when seasonal trend is significantly worse', () => {
      const winter = getHourlyConditions(new Date('2026-12-15T14:00:00Z'), 14);

      expect(winter.conditions['10m']).toBe('good');
    });
  });

  describe('getBandRecommendations', () => {
    it('returns 24 hourly entries and includes non-empty reasons', () => {
      const forecast = getBandRecommendations(new Date('2026-06-15T09:00:00Z'));

      expect(forecast.hourByHour).toHaveLength(24);
      expect(forecast.recommendations.length).toBeGreaterThan(0);
      expect(forecast.recommendations.every((item) => item.reason.length > 0)).toBe(true);
    });

    it('sorts recommendations by best condition and excludes poor-only bands', () => {
      const forecast = getBandRecommendations(new Date('2026-12-15T09:00:00Z'));

      const rank = { excellent: 4, good: 3, fair: 2, poor: 1 } as const;
      for (let i = 1; i < forecast.recommendations.length; i++) {
        const previous = forecast.recommendations[i - 1];
        const current = forecast.recommendations[i];
        if (previous !== undefined && current !== undefined) {
          expect(rank[previous.condition]).toBeGreaterThanOrEqual(rank[current.condition]);
        }
      }

      expect(forecast.recommendations.every((item) => item.condition !== 'poor')).toBe(true);
    });

    it('groups consecutive hours into single time-slot ranges', () => {
      const forecast = getBandRecommendations(new Date('2026-06-15T12:00:00Z'));
      const sixMeters = forecast.recommendations.find((item) => item.band === '6m');

      expect(sixMeters).toBeDefined();
      expect(sixMeters?.timeSlots).toContain('07:00-18:00');
    });
  });
});
