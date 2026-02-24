import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Home } from '../../../src/renderer/pages/home';
import { renderWithProviders } from '../../helpers/render-with-providers';

describe('renderer/pages/home', () => {
  it('renders hero content and quick action cards', () => {
    renderWithProviders(<Home />);

    expect(screen.getByRole('heading', { name: /Welcome to POTA Activation Planner/i })).toBeInTheDocument();
    expect(screen.getByText('Discover Parks')).toBeInTheDocument();
    expect(screen.getByText('Create Activation Plan')).toBeInTheDocument();
    expect(screen.getByText('View My Plans')).toBeInTheDocument();
  });

  it('contains navigation links for primary actions', () => {
    renderWithProviders(<Home />);

    expect(screen.getByRole('link', { name: 'Browse Parks' })).toHaveAttribute('href', '/parks');
    expect(screen.getByRole('link', { name: 'Start Planning' })).toHaveAttribute('href', '/plans/new');
    expect(screen.getByRole('link', { name: 'View Plans' })).toHaveAttribute('href', '/plans');
  });
});
