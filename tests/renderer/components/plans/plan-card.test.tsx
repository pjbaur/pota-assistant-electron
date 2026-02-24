import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createPlan } from '../../../helpers/fixtures';
import { PlanCard } from '../../../../src/renderer/components/plans/plan-card';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('renderer/components/plans/plan-card', () => {
  it('navigates to plan detail on click', () => {
    const plan = createPlan();

    render(<PlanCard plan={plan} />);

    fireEvent.click(screen.getByRole('button'));
    expect(navigateMock).toHaveBeenCalledWith(`/plans/${plan.id}`);
  });

  it('supports keyboard activation with Enter', () => {
    const plan = createPlan();

    render(<PlanCard plan={plan} />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(navigateMock).toHaveBeenCalledWith(`/plans/${plan.id}`);
  });

  it('shows overnight duration and optional equipment details', () => {
    const plan = createPlan({
      startTime: '23:30',
      endTime: '01:00',
      equipmentPreset: {
        id: 'preset-1',
        name: 'Field Kit',
        radio: 'KX2',
        antenna: 'EFHW',
        powerWatts: 10,
        mode: 'CW',
      },
      status: 'finalized',
    });

    render(<PlanCard plan={plan} />);

    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    expect(screen.getByText('Finalized')).toBeInTheDocument();
    expect(screen.getByText(/Field Kit - KX2/)).toBeInTheDocument();
  });
});
