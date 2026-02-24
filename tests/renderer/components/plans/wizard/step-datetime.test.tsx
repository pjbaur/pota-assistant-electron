import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  StepDatetime,
  type DateTimeData,
} from '../../../../../src/renderer/components/plans/wizard/step-datetime';

describe('renderer/components/plans/wizard/step-datetime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-24T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-calculates end time when start time changes', () => {
    const onChange = vi.fn();
    const data: DateTimeData = {
      date: '2026-02-24',
      startTime: '08:00',
      endTime: '11:00',
      timeReference: 'utc',
    };

    render(<StepDatetime data={data} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Start Time'), {
      target: { value: '10:15' },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...data,
      startTime: '10:15',
      endTime: '13:15',
      timeReference: 'utc',
    });
  });

  it('shows validation error for dates before today', () => {
    render(
      <StepDatetime
        data={{
          date: '2026-02-23',
          startTime: '08:00',
          endTime: '11:00',
          timeReference: 'utc',
        }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Date must be today or in the future')).toBeInTheDocument();
  });

  it('renders timezone summary and allows switching to UTC reference', () => {
    const onChange = vi.fn();

    render(
      <StepDatetime
        data={{
          date: '2026-02-24',
          startTime: '08:00',
          endTime: '11:00',
          timeReference: 'park',
        }}
        parkTimezone="America/Denver"
        onChange={onChange}
      />
    );

    expect(screen.getByText(/Park timezone:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'UTC' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'UTC' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ timeReference: 'utc' }));
  });

  describe('UTC time conversion display', () => {
    /**
     * UTC conversion math:
     * - MST (Mountain Standard Time) is UTC-7
     * - To convert local time to UTC: UTC = local + offset
     * - 09:00 MST + 7 hours = 16:00 UTC
     * - This is CORRECT behavior
     *
     * Note: "UTC-7" means the timezone is 7 hours BEHIND UTC.
     * So when it's 09:00 in MST, it's 16:00 in UTC (09 + 7 = 16).
     */
    it('displays correct UTC time when entering park time in MST (UTC-7)', () => {
      // 09:00 MST (America/Denver in winter) = 16:00 UTC
      // MST is UTC-7, so we ADD 7 hours to local time to get UTC
      render(
        <StepDatetime
          data={{
            date: '2026-02-24',
            startTime: '09:00',
            endTime: '12:00',
            timeReference: 'park',
          }}
          parkTimezone="America/Denver"
          onChange={vi.fn()}
        />
      );

      // UTC time should be 16:00 (09:00 + 7 hours)
      // Use getAllByText since there are multiple time displays
      const utcTimeDisplays = screen.getAllByText(/16:00 - 19:00/);
      expect(utcTimeDisplays.length).toBeGreaterThan(0);

      // Park time should still show the original input
      const parkTimeDisplays = screen.getAllByText(/09:00 - 12:00/);
      expect(parkTimeDisplays.length).toBeGreaterThan(0);
    });

    it('displays correct UTC time when entering park time in EST (UTC-5)', () => {
      // 09:00 EST (America/New_York in winter) = 14:00 UTC
      // EST is UTC-5, so we ADD 5 hours to local time to get UTC
      render(
        <StepDatetime
          data={{
            date: '2026-02-24',
            startTime: '09:00',
            endTime: '12:00',
            timeReference: 'park',
          }}
          parkTimezone="America/New_York"
          onChange={vi.fn()}
        />
      );

      expect(screen.getAllByText(/14:00 - 17:00/).length).toBeGreaterThan(0); // 09:00 + 5 = 14:00
    });

    it('displays correct UTC time when entering park time in PST (UTC-8)', () => {
      // 09:00 PST (America/Los_Angeles in winter) = 17:00 UTC
      // PST is UTC-8, so we ADD 8 hours to local time to get UTC
      render(
        <StepDatetime
          data={{
            date: '2026-02-24',
            startTime: '09:00',
            endTime: '12:00',
            timeReference: 'park',
          }}
          parkTimezone="America/Los_Angeles"
          onChange={vi.fn()}
        />
      );

      expect(screen.getAllByText(/17:00 - 20:00/).length).toBeGreaterThan(0); // 09:00 + 8 = 17:00
    });

    it('displays correct UTC time when entering park time in JST (UTC+9)', () => {
      // 09:00 JST (Asia/Tokyo) = 00:00 UTC
      // JST is UTC+9, so we SUBTRACT 9 hours from local time to get UTC
      render(
        <StepDatetime
          data={{
            date: '2026-02-24',
            startTime: '09:00',
            endTime: '12:00',
            timeReference: 'park',
          }}
          parkTimezone="Asia/Tokyo"
          onChange={vi.fn()}
        />
      );

      expect(screen.getAllByText(/00:00 - 03:00/).length).toBeGreaterThan(0); // 09:00 - 9 = 00:00
    });

    it('displays same time when entering UTC reference', () => {
      // When timeReference is 'utc', input is already UTC
      render(
        <StepDatetime
          data={{
            date: '2026-02-24',
            startTime: '16:00',
            endTime: '19:00',
            timeReference: 'utc',
          }}
          parkTimezone="America/Denver"
          onChange={vi.fn()}
        />
      );

      // UTC section should show the same times (16:00 - 19:00)
      expect(screen.getAllByText(/16:00 - 19:00/).length).toBeGreaterThan(0);

      // Park section should show converted times (16:00 - 7 = 09:00 MST)
      expect(screen.getAllByText(/09:00 - 12:00/).length).toBeGreaterThan(0);
    });

    it('handles DST transition correctly for America/Denver in summer (MDT = UTC-6)', () => {
      // July is during MDT (Mountain Daylight Time, UTC-6)
      render(
        <StepDatetime
          data={{
            date: '2026-07-15',
            startTime: '09:00',
            endTime: '12:00',
            timeReference: 'park',
          }}
          parkTimezone="America/Denver"
          onChange={vi.fn()}
        />
      );

      // MDT is UTC-6, so 09:00 + 6 = 15:00 UTC
      expect(screen.getAllByText(/15:00 - 18:00/).length).toBeGreaterThan(0);
    });
  });
});
