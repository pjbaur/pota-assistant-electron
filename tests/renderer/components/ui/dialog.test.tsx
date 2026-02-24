import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '../../../../src/renderer/components/ui/dialog';

describe('renderer/components/ui/dialog', () => {
  it('renders title, description, and body content when open', () => {
    render(
      <Dialog open>
        <DialogContent title="Confirm action" description="This cannot be undone.">
          <p>Dialog body</p>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Confirm action')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when a close action is triggered', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent title="Close me">
          <DialogClose>
            <button type="button">Dismiss</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('opens content from trigger in uncontrolled mode', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger asChild>
          <button type="button">Open Dialog</button>
        </DialogTrigger>
        <DialogContent title="Opened">Ready</DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Opened')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Dialog' }));

    expect(await screen.findByText('Opened')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});
