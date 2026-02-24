import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createParkReference } from '../../../src/shared/types';
import { createPark } from '../../helpers/fixtures';
import { renderWithProviders } from '../../helpers/render-with-providers';
import { Parks } from '../../../src/renderer/pages/parks';

const { useParksMock, useParkMock } = vi.hoisted(() => ({
  useParksMock: vi.fn(),
  useParkMock: vi.fn(),
}));

vi.mock('../../../src/renderer/hooks/use-parks', () => ({
  useParks: useParksMock,
  usePark: useParkMock,
}));

vi.mock('../../../src/renderer/components/park', () => ({
  ParkCard: ({ park, onClick }: { park: { name: string }; onClick: (park: { name: string }) => void }) => (
    <button type="button" onClick={() => onClick(park)}>
      card-{park.name}
    </button>
  ),
  ParkDetail: ({ park, onClose }: { park: { name: string }; onClose: () => void }) => (
    <div>
      detail-{park.name}
      <button type="button" onClick={onClose}>
        close-detail
      </button>
    </div>
  ),
  ParkSearch: () => <div>park-search</div>,
}));

vi.mock('../../../src/renderer/components/map', () => ({
  MapContainerComponent: ({ parks }: { parks: Array<{ name: string }> }) => <div>map-{parks.length}</div>,
}));

function buildUseParksReturn(overrides: Record<string, unknown> = {}) {
  return {
    parks: [],
    selectedPark: null,
    favorites: [],
    filters: { query: '', entity: undefined, program: undefined },
    isLoading: false,
    error: null,
    totalResults: 0,
    searchParks: vi.fn().mockResolvedValue(undefined),
    selectPark: vi.fn(),
    clearFilters: vi.fn(),
    ...overrides,
  };
}

describe('renderer/pages/parks', () => {
  beforeEach(() => {
    useParksMock.mockReturnValue(buildUseParksReturn());
    useParkMock.mockReturnValue({
      park: null,
      isLoading: false,
      error: null,
      fetchPark: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders list view with park cards', () => {
    const parkA = createPark({ name: 'Yellowstone' });
    const parkB = createPark({ name: 'Grand Canyon', reference: createParkReference('K-0002') });

    useParksMock.mockReturnValue(
      buildUseParksReturn({
        parks: [parkA, parkB],
        totalResults: 2,
      })
    );

    renderWithProviders(<Parks />);

    expect(screen.getByText('Parks')).toBeInTheDocument();
    expect(screen.getByText('2 parks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'card-Yellowstone' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'card-Grand Canyon' })).toBeInTheDocument();
  });

  it('switches between list and map views', () => {
    const park = createPark({ name: 'Arches' });

    useParksMock.mockReturnValue(buildUseParksReturn({ parks: [park], totalResults: 1 }));

    renderWithProviders(<Parks />);

    fireEvent.click(screen.getByRole('button', { name: 'Map view' }));
    expect(screen.getByText('map-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    expect(screen.getByRole('button', { name: 'card-Arches' })).toBeInTheDocument();
  });

  it('opens and closes the detail panel after selecting a park', () => {
    const park = createPark({ name: 'Acadia' });

    useParksMock.mockReturnValue(
      buildUseParksReturn({
        parks: [park],
        selectedPark: park,
        totalResults: 1,
      })
    );

    renderWithProviders(<Parks />);

    fireEvent.click(screen.getByRole('button', { name: 'card-Acadia' }));
    expect(screen.getByText('detail-Acadia')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close-detail' }));
    expect(screen.queryByText('detail-Acadia')).not.toBeInTheDocument();
  });
});
