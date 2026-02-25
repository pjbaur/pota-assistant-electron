import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPark } from '../../../../helpers/fixtures';
import { StepPark } from '../../../../../src/renderer/components/plans/wizard/step-park';

const { useParksMock } = vi.hoisted(() => ({
  useParksMock: vi.fn(),
}));

vi.mock('../../../../../src/renderer/hooks/use-parks', () => ({
  useParks: useParksMock,
}));

function createUseParksValue(overrides: Record<string, unknown> = {}) {
  return {
    parks: [],
    selectedPark: null,
    favorites: [],
    filters: { query: '', entity: undefined, program: undefined, favoritesOnly: undefined },
    isLoading: false,
    error: null,
    totalResults: 0,
    currentPage: 1,
    pageSize: 20,
    searchParks: vi.fn().mockResolvedValue(undefined),
    selectPark: vi.fn(),
    toggleFavorite: vi.fn(),
    loadMore: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    clearFilters: vi.fn(),
    ...overrides,
  };
}

describe('renderer/components/plans/wizard/step-park', () => {
  beforeEach(() => {
    useParksMock.mockReturnValue(createUseParksValue());
  });

  it('renders available parks and selects one on click', () => {
    const park = createPark();
    const onParkSelect = vi.fn();

    useParksMock.mockReturnValue(
      createUseParksValue({
        parks: [park],
        favorites: [park.reference],
      })
    );

    render(<StepPark selectedPark={null} onParkSelect={onParkSelect} />);

    fireEvent.click(screen.getByRole('button', { name: new RegExp(park.name, 'i') }));
    expect(onParkSelect).toHaveBeenCalledWith(park);
    expect(screen.getByText(`${park.reference} - ${park.entityId}`)).toBeInTheDocument();
  });

  it('renders API error state', () => {
    useParksMock.mockReturnValue(
      createUseParksValue({
        error: 'Failed to fetch parks',
      })
    );

    render(<StepPark selectedPark={null} onParkSelect={vi.fn()} />);

    expect(screen.getByText('Failed to fetch parks')).toBeInTheDocument();
  });

  it('renders confirmation panel for selected park', () => {
    const park = createPark();

    render(<StepPark selectedPark={park} onParkSelect={vi.fn()} />);

    const name = screen.getByText(park.name);
    const details = screen.getByText(`${park.reference} - ${park.gridSquare}`);

    expect(name).toBeInTheDocument();
    expect(details).toBeInTheDocument();
    expect(name).toHaveClass('dark:text-emerald-100');
    expect(details).toHaveClass('dark:text-emerald-300');
  });

  it('renders favorites toggle button', () => {
    render(<StepPark selectedPark={null} onParkSelect={vi.fn()} />);

    // The button has a star icon and "Favorites" text (hidden on small screens)
    const favoritesButton = screen.getByRole('button', { name: /favorites/i });
    expect(favoritesButton).toBeInTheDocument();
  });

  it('toggles favorites filter when favorites button is clicked', () => {
    const searchParks = vi.fn().mockResolvedValue(undefined);
    useParksMock.mockReturnValue(
      createUseParksValue({
        searchParks,
        favorites: ['K-0039'],
      })
    );

    render(<StepPark selectedPark={null} onParkSelect={vi.fn()} />);

    const favoritesButton = screen.getByRole('button', { name: /favorites/i });
    fireEvent.click(favoritesButton);

    expect(searchParks).toHaveBeenCalledWith({ favoritesOnly: true });
  });

  it('shows favorites button in active state when filter is enabled', () => {
    useParksMock.mockReturnValue(
      createUseParksValue({
        filters: { query: '', entity: undefined, program: undefined, favoritesOnly: true },
      })
    );

    render(<StepPark selectedPark={null} onParkSelect={vi.fn()} />);

    const favoritesButton = screen.getByRole('button', { name: /favorites/i });
    // When active, the button has yellow styling
    expect(favoritesButton).toHaveClass('border-yellow-400');
  });
});
