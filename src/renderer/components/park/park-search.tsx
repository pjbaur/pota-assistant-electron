import { useState, useCallback, useEffect, useRef } from 'react';
import { Input, Button, Tooltip } from '../ui';
import type { ParkSearchFilters } from '../../stores/park-store';

export interface ParkSearchProps {
  filters: ParkSearchFilters;
  onSearch: (filters: Partial<ParkSearchFilters>) => void;
  onClear: () => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Common program types for filtering
 */
const PROGRAM_OPTIONS = [
  { value: '', label: 'All Programs' },
  { value: 'NPS', label: 'National Park Service' },
  { value: 'SP', label: 'State Park' },
  { value: 'USFS', label: 'US Forest Service' },
  { value: 'BLM', label: 'Bureau of Land Management' },
  { value: 'USFWS', label: 'US Fish & Wildlife Service' },
  { value: 'COE', label: 'Army Corps of Engineers' },
  { value: 'TVA', label: 'Tennessee Valley Authority' },
  { value: 'ARC', label: 'Appalachian Trail' },
  { value: 'RVR', label: 'River' },
  { value: 'LKE', label: 'Lake' },
  { value: 'WMA', label: 'Wildlife Management Area' },
];

export function ParkSearch({ filters, onSearch, onClear }: ParkSearchProps): JSX.Element {
  const [showFilters, setShowFilters] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.query);
  const [localProgram, setLocalProgram] = useState(filters.program ?? '');
  const debouncedQuery = useDebounce(localQuery, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state with props
  useEffect(() => {
    setLocalQuery(filters.query);
  }, [filters.query]);

  useEffect(() => {
    setLocalProgram(filters.program ?? '');
  }, [filters.program]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== filters.query) {
      onSearch({ query: debouncedQuery });
    }
  }, [debouncedQuery, filters.query, onSearch]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalQuery(e.target.value);
    },
    []
  );

  const handleProgramChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const program = e.target.value;
      setLocalProgram(program);
      onSearch({ program: program || undefined });
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setLocalQuery('');
    setLocalProgram('');
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClear();
      }
    },
    [handleClear]
  );

  const hasActiveFilters = localQuery !== '' || localProgram !== '';

  return (
    <div className="space-y-3">
      {/* Main search row */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            placeholder="Search parks by name, reference, or location..."
            value={localQuery}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            leftIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
            rightIcon={
              hasActiveFilters ? (
                <button
                  onClick={handleClear}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : undefined
            }
          />
        </div>
        <Tooltip content={showFilters ? 'Hide filters' : 'Show filters'}>
          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="park-filters"
            leftIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            }
          >
            Filters
          </Button>
        </Tooltip>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          id="park-filters"
          className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900"
        >
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="program-filter"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Program Type
            </label>
            <select
              id="program-filter"
              value={localProgram}
              onChange={handleProgramChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {PROGRAM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
