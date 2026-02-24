import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toast, ToastProvider } from '../../../../src/renderer/components/ui/toast';

describe('renderer/components/ui/toast', () => {
  it('renders toast title and optional description', () => {
    render(
      <ToastProvider>
        <Toast
          toast={{ id: 't1', title: 'Saved', description: 'Plan updated', variant: 'success' }}
          onOpenChange={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Plan updated')).toBeInTheDocument();
  });

  it('applies variant classes for success toasts', () => {
    const { container } = render(
      <ToastProvider>
        <Toast toast={{ id: 't1', title: 'Success', variant: 'success' }} onOpenChange={vi.fn()} />
      </ToastProvider>
    );

    expect(container.querySelector('[class*="bg-success-50"]')).toBeInTheDocument();
  });

  it('invokes onOpenChange when close button is clicked', async () => {
    const onOpenChange = vi.fn();

    const { container } = render(
      <ToastProvider>
        <Toast toast={{ id: 't1', title: 'Close me' }} onOpenChange={onOpenChange} />
      </ToastProvider>
    );

    const closeButton = container.querySelector('button');
    expect(closeButton).not.toBeNull();

    if (closeButton !== null) {
      fireEvent.click(closeButton);
    }

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
