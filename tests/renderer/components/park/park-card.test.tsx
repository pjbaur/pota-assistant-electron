import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ParkCard } from '../../../../src/renderer/components/park/park-card';
import { useUIStore } from '../../../../src/renderer/stores/ui-store';
import { createPark } from '../../../helpers/fixtures';
import { renderWithProviders } from '../../../helpers/render-with-providers';

describe('renderer/components/park/park-card', () => {
  it('renders park details and notifies on card click', async () => {
    const user = userEvent.setup();
    const park = createPark();
    const onClick = vi.fn();

    renderWithProviders(<ParkCard park={park} onClick={onClick} />);

    expect(screen.getByText('K-0039')).toBeInTheDocument();
    expect(screen.getByText(park.name)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /K-0039/i }));
    expect(onClick).toHaveBeenCalledWith(park);
  });

  it('toggles favorite via IPC without triggering parent click', async () => {
    const user = userEvent.setup();
    const park = createPark({ name: 'Teton' });
    const onClick = vi.fn();

    renderWithProviders(<ParkCard park={park} onClick={onClick} />);

    vi.mocked(window.electronAPI.invoke).mockResolvedValueOnce({
      success: true,
      data: { reference: park.reference, isFavorite: true },
    } as never);

    await user.click(screen.getByRole('button', { name: 'Add to favorites' }));

    await waitFor(() => {
      expect(window.electronAPI.invoke).toHaveBeenCalledWith('parks:favorite:toggle', {
        reference: park.reference,
      });
    });

    expect(onClick).not.toHaveBeenCalled();
    expect(useUIStore.getState().toasts[0]).toEqual(
      expect.objectContaining({
        title: 'Added to favorites',
        description: 'Teton',
        variant: 'success',
      })
    );
  });
});
