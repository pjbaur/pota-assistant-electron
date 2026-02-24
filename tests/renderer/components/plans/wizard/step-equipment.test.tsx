import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepEquipment } from '../../../../../src/renderer/components/plans/wizard/step-equipment';

describe('renderer/components/plans/wizard/step-equipment', () => {
  it('selects a preset when clicked', () => {
    const onPresetSelect = vi.fn();

    render(<StepEquipment selectedPreset={null} onPresetSelect={onPresetSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /QRP Portable/ }));

    expect(onPresetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'qrp-portable',
        powerWatts: 5,
      })
    );
  });

  it('renders selected preset summary block', () => {
    const selectedPreset = {
      id: 'mobile-high',
      name: 'Mobile/High Power (≥50W)',
      radio: 'Mobile Radio',
      antenna: 'Mobile Antenna',
      powerWatts: 50,
      mode: 'SSB',
      notes: 'Maximum power from vehicle',
    };

    render(<StepEquipment selectedPreset={selectedPreset} onPresetSelect={vi.fn()} />);

    expect(screen.getAllByText(selectedPreset.name)).toHaveLength(2);
    expect(
      screen.getByText(/Mobile Radio\s*\/\s*Mobile Antenna\s*\/\s*50W\s*\/\s*SSB/)
    ).toBeInTheDocument();
  });
});
