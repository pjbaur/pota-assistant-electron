import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ISODateString, PlanId } from '../../../src/shared/types';
import { createPlan } from '../../helpers/fixtures';
import { renderWithProviders } from '../../helpers/render-with-providers';
import { Plans } from '../../../src/renderer/pages/plans';

const { usePlansMock } = vi.hoisted(() => ({
  usePlansMock: vi.fn(),
}));

vi.mock('../../../src/renderer/hooks/use-plans', () => ({
  usePlans: usePlansMock,
}));

vi.mock('../../../src/renderer/components/plans', () => ({
  PlanCard: ({ plan }: { plan: { name: string } }) => <div data-testid="plan-card">{plan.name}</div>,
  PlanCardSkeletonList: ({ count }: { count: number }) => <div>loading-{count}</div>,
}));

function buildUsePlansReturn(overrides: Record<string, unknown> = {}) {
  return {
    plans: [],
    isLoading: false,
    error: null,
    fetchPlans: vi.fn().mockResolvedValue(undefined),
    currentPlan: null,
    equipmentPresets: [],
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn(),
    selectPlan: vi.fn(),
    ...overrides,
  };
}

describe('renderer/pages/plans', () => {
  beforeEach(() => {
    usePlansMock.mockReturnValue(buildUsePlansReturn());
  });

  it('renders empty-state messaging when there are no plans', () => {
    renderWithProviders(<Plans />);

    expect(screen.getByText('No Plans Yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create Your First Plan' })).toHaveAttribute(
      'href',
      '/plans/new'
    );
  });

  it('renders error state and retries loading plans', () => {
    const fetchPlans = vi.fn().mockResolvedValue(undefined);

    usePlansMock.mockReturnValue(
      buildUsePlansReturn({
        error: 'Network unavailable',
        fetchPlans,
      })
    );

    renderWithProviders(<Plans />);

    const callsBefore = fetchPlans.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Network unavailable')).toBeInTheDocument();
    expect(fetchPlans.mock.calls.length).toBe(callsBefore + 1);
  });

  it('filters plans by date range and clears filters', () => {
    const older = createPlan({
      name: 'Older Plan',
      activationDate: '2026-03-01' as ISODateString,
    });
    const newer = createPlan({
      name: 'Newer Plan',
      id: '550e8400-e29b-41d4-a716-446655440001' as PlanId,
      activationDate: '2026-03-20' as ISODateString,
    });

    usePlansMock.mockReturnValue(
      buildUsePlansReturn({
        plans: [older, newer],
      })
    );

    renderWithProviders(<Plans />);

    expect(screen.getAllByTestId('plan-card')).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('From Date'), {
      target: { value: '2026-03-10' },
    });

    expect(screen.getAllByTestId('plan-card')).toHaveLength(1);
    expect(screen.getByText('Newer Plan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getAllByTestId('plan-card')).toHaveLength(2);
  });
});
