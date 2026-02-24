import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../../../../src/renderer/components/ui/button';

describe('renderer/components/ui/button', () => {
  it('renders with default variant and size classes', () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('bg-primary-600');
    expect(button).toHaveClass('px-4');
    expect(button).toHaveClass('py-2');
  });

  it('renders loading state and disables interactions', () => {
    const { container } = render(
      <Button isLoading leftIcon={<span>left</span>} rightIcon={<span>right</span>}>
        Submit
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toBeDisabled();
    expect(screen.queryByText('left')).not.toBeInTheDocument();
    expect(screen.queryByText('right')).not.toBeInTheDocument();
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('renders optional icons when not loading', () => {
    render(
      <Button leftIcon={<span data-testid="left-icon">L</span>} rightIcon={<span data-testid="right-icon">R</span>}>
        Continue
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
