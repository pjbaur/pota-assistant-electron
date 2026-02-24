import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createEquipmentPreset, createPark } from '../../../../helpers/fixtures';
import { StepReview } from '../../../../../src/renderer/components/plans/wizard/step-review';

describe('renderer/components/plans/wizard/step-review', () => {
  it('shows validation placeholders when required sections are missing', () => {
    render(
      <StepReview
        park={null}
        datetime={{ date: '', startTime: '', endTime: '', timeReference: 'utc' }}
        equipment={null}
        bands={[]}
        notes=""
        onNotesChange={vi.fn()}
        onEditStep={vi.fn()}
      />
    );

    expect(screen.getByText('No park selected')).toBeInTheDocument();
    expect(screen.getByText('No date selected')).toBeInTheDocument();
    expect(screen.getByText('No bands selected')).toBeInTheDocument();
  });

  it('invokes edit callback for a section and tracks notes changes', () => {
    const onNotesChange = vi.fn();
    const onEditStep = vi.fn();

    render(
      <StepReview
        park={createPark()}
        datetime={{ date: '2026-02-24', startTime: '08:00', endTime: '11:00', timeReference: 'utc' }}
        equipment={createEquipmentPreset()}
        bands={['20m', '40m']}
        notes="Initial"
        onNotesChange={onNotesChange}
        onEditStep={onEditStep}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    expect(onEditStep).toHaveBeenCalledWith('park');

    fireEvent.change(screen.getByLabelText('Notes (optional)'), {
      target: { value: 'Bring spare coax' },
    });
    expect(onNotesChange).toHaveBeenCalledWith('Bring spare coax');
  });
});
