import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BandPanel } from '../../../../src/renderer/components/band/band-panel';
import type { DayBandForecast } from '../../../../src/shared/types/band-types';

// Helper to create mock forecast data
function createMockForecast(date = '2024-01-15'): DayBandForecast {
  const hourByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    conditions: {
      '20m': 'good' as const,
      '40m': 'excellent' as const,
      '80m': 'fair' as const,
    },
  }));

  return {
    date,
    hourByHour,
    recommendations: [
      { band: '40m', condition: 'excellent', reason: 'Great conditions', timeSlots: ['09:00-12:00'] },
      { band: '20m', condition: 'good', reason: 'Good conditions', timeSlots: ['12:00-15:00'] },
    ],
  };
}

// Helper to get highlighted hour headers from the table
function getHighlightedHours(container: HTMLElement): string[] {
  // Select only the hour headers (th elements in thead, excluding the first "Band" header)
  const hourHeaders = container.querySelectorAll('thead th');
  const highlighted: string[] = [];

  hourHeaders.forEach((th, index) => {
    // Skip the first header which is "Band"
    if (index === 0) return;
    if (th.className.includes('bg-blue-600')) {
      highlighted.push(th.textContent ?? '');
    }
  });

  return highlighted;
}

describe('BandPanel', () => {
  describe('activation hours highlighting', () => {
    it('highlights activation hours based on start and end time', () => {
      const forecast = createMockForecast();

      const { container } = render(
        <BandPanel
          recommendations={forecast}
          activationStartTime="09:00"
          activationEndTime="11:00"
        />
      );

      // Hours 09, 10, 11 should be highlighted
      const highlightedHours = getHighlightedHours(container);

      // Should highlight hours 9, 10, 11
      expect(highlightedHours).toEqual(['09', '10', '11']);
    });

    it('rounds up end time to nearest hour when there are minutes', () => {
      const forecast = createMockForecast();

      const { container } = render(
        <BandPanel
          recommendations={forecast}
          activationStartTime="09:00"
          activationEndTime="11:30"
        />
      );

      const highlightedHours = getHighlightedHours(container);

      // Should highlight hours 9, 10, 11, 12 (11:30 rounds up to 12)
      expect(highlightedHours).toEqual(['09', '10', '11', '12']);
    });

    it('handles overnight activations that cross midnight', () => {
      const forecast = createMockForecast();

      const { container } = render(
        <BandPanel
          recommendations={forecast}
          activationStartTime="22:00"
          activationEndTime="02:00"
        />
      );

      const highlightedHours = getHighlightedHours(container);

      // Should highlight hours 00, 01, 02, 22, 23 (in DOM order 00-23)
      expect(highlightedHours.sort()).toEqual(['00', '01', '02', '22', '23']);
    });

    it('highlights single hour when start and end are the same hour', () => {
      const forecast = createMockForecast();

      const { container } = render(
        <BandPanel
          recommendations={forecast}
          activationStartTime="09:00"
          activationEndTime="09:30"
        />
      );

      const highlightedHours = getHighlightedHours(container);

      // Should highlight hours 9 and 10 (09:30 rounds up to 10)
      expect(highlightedHours).toEqual(['09', '10']);
    });

    it('falls back to current hour when no activation times provided', () => {
      const forecast = createMockForecast();

      const { container } = render(<BandPanel recommendations={forecast} />);

      const highlightedHours = getHighlightedHours(container);

      // Should highlight exactly one hour (current hour)
      expect(highlightedHours.length).toBe(1);
    });

    it('falls back to current hour when only start time is provided', () => {
      const forecast = createMockForecast();

      const { container } = render(
        <BandPanel
          recommendations={forecast}
          activationStartTime="09:00"
        />
      );

      const highlightedHours = getHighlightedHours(container);

      // Should highlight exactly one hour (current hour)
      expect(highlightedHours.length).toBe(1);
    });

    it('falls back to current hour when only end time is provided', () => {
      const forecast = createMockForecast();

      const { container } = render(
        <BandPanel
          recommendations={forecast}
          activationEndTime="11:00"
        />
      );

      const highlightedHours = getHighlightedHours(container);

      // Should highlight exactly one hour (current hour)
      expect(highlightedHours.length).toBe(1);
    });
  });

  describe('basic rendering', () => {
    it('renders the band conditions grid', () => {
      const forecast = createMockForecast();

      render(<BandPanel recommendations={forecast} />);

      // Check for title
      expect(screen.getByText(/Band Conditions - 2024-01-15/)).toBeInTheDocument();

      // Check for band labels (use getAllBy since they appear in both grid and recommendations)
      expect(screen.getAllByText('20m').length).toBeGreaterThan(0);
      expect(screen.getAllByText('40m').length).toBeGreaterThan(0);
      expect(screen.getAllByText('80m').length).toBeGreaterThan(0);
    });

    it('renders legend with condition colors', () => {
      const forecast = createMockForecast();

      render(<BandPanel recommendations={forecast} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('Fair')).toBeInTheDocument();
      expect(screen.getByText('Poor')).toBeInTheDocument();
    });

    it('renders top recommendations', () => {
      const forecast = createMockForecast();

      render(<BandPanel recommendations={forecast} />);

      expect(screen.getByText('Top Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Great conditions')).toBeInTheDocument();
      expect(screen.getByText('Good conditions')).toBeInTheDocument();
    });
  });
});
