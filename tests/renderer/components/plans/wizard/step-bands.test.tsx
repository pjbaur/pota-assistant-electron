import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepBands } from '../../../../../src/renderer/components/plans/wizard/step-bands';

describe('renderer/components/plans/wizard/step-bands', () => {
  it('toggles a band selection', () => {
    const onBandsChange = vi.fn();

    render(<StepBands selectedBands={[]} onBandsChange={onBandsChange} />);

    fireEvent.click(screen.getByRole('button', { name: /^20m/i }));

    expect(onBandsChange).toHaveBeenCalledWith(['20m']);
  });

  it('supports select-all and clear-all actions', () => {
    const onBandsChange = vi.fn();

    render(<StepBands selectedBands={['20m']} onBandsChange={onBandsChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Select All' }));
    expect(onBandsChange).toHaveBeenCalledWith(
      expect.arrayContaining(['80m', '60m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m', '2m'])
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(onBandsChange).toHaveBeenCalledWith([]);
  });
});
