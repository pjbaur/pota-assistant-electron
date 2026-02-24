import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParkSearch } from '../../../../src/renderer/components/park/park-search';

describe('renderer/components/park/park-search', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces query changes before calling onSearch', () => {
    const onSearch = vi.fn();

    render(
      <ParkSearch
        filters={{ query: '', entity: undefined, program: undefined }}
        onSearch={onSearch}
        onClear={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/search parks by name/i), {
      target: { value: 'Yellow' },
    });

    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith({ query: 'Yellow' });
  });

  it('shows filter panel and applies program filter', () => {
    const onSearch = vi.fn();

    render(
      <ParkSearch
        filters={{ query: '', entity: undefined, program: undefined }}
        onSearch={onSearch}
        onClear={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByText('Program Type')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Program Type'), {
      target: { value: 'NPS' },
    });

    expect(onSearch).toHaveBeenCalledWith({ program: 'NPS' });
  });

  it('clears filters on escape key press', () => {
    const onClear = vi.fn();

    render(
      <ParkSearch
        filters={{ query: 'abc', entity: undefined, program: undefined }}
        onSearch={vi.fn()}
        onClear={onClear}
      />
    );

    fireEvent.keyDown(screen.getByPlaceholderText(/search parks by name/i), {
      key: 'Escape',
    });

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
