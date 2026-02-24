import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Sidebar } from '../../../../src/renderer/components/layout/sidebar';

describe('renderer/components/layout/sidebar', () => {
  it('highlights the active route and renders main navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/plans']}>
        <Sidebar isOpen />
      </MemoryRouter>
    );

    const plansLink = screen.getByRole('link', { name: /plans/i });
    expect(plansLink).toHaveClass('bg-primary-50');

    const newPlanLink = screen.getByRole('link', { name: /new plan/i });
    expect(newPlanLink).toHaveAttribute('href', '/plans/new');
  });

  it('applies closed transform when sidebar is not open', () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar isOpen={false} />
      </MemoryRouter>
    );

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('-translate-x-full');
  });
});
