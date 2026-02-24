import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../helpers/render-with-providers';
import { Settings } from '../../../src/renderer/pages/settings';

const setThemeMock = vi.fn();

vi.mock('../../../src/renderer/hooks', () => ({
  useTheme: () => ({
    theme: 'system' as const,
    setTheme: setThemeMock,
    isDark: false,
  }),
}));

vi.mock('../../../src/renderer/components/settings', () => ({
  ProfileSection: () => <section>profile-section</section>,
  DataSection: () => <section>data-section</section>,
}));

vi.mock('../../../src/renderer/components/ui', () => ({
  Select: ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  }) => (
    <label>
      {label}
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

describe('renderer/pages/settings', () => {
  it('renders settings sections and about content', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('profile-section')).toBeInTheDocument();
    expect(screen.getByText('data-section')).toBeInTheDocument();
    expect(screen.getByText('POTA Activation Planner')).toBeInTheDocument();
  });

  it('updates theme preference from the appearance selector', () => {
    renderWithProviders(<Settings />);

    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'dark' } });

    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });
});
