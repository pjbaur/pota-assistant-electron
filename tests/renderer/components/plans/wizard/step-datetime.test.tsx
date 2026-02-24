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
});
