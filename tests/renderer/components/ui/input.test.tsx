import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../../../../src/renderer/components/ui/input';

describe('renderer/components/ui/input', () => {
  it('wires label to generated input id', () => {
    render(<Input label="Operator Callsign" helperText="Enter your call" />);

    const input = screen.getByLabelText('Operator Callsign');
    expect(input).toHaveAttribute('id', 'operator-callsign');
    expect(screen.getByText('Enter your call')).toBeInTheDocument();
  });

  it('applies error variant styles to input and helper text', () => {
    render(<Input label="Name" variant="error" helperText="Required field" />);

    const input = screen.getByLabelText('Name');
    expect(input).toHaveClass('border-error-500');

    const helper = screen.getByText('Required field');
    expect(helper).toHaveClass('text-error-600');
  });

  it('renders both icon containers and spacing classes', () => {
    render(
      <Input
        label="Search"
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      />
    );

    const input = screen.getByLabelText('Search');
    expect(input).toHaveClass('pl-10');
    expect(input).toHaveClass('pr-10');
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
