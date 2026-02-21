import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Select, Input } from '../components/ui';
import { PlanCard, PlanCardSkeletonList } from '../components/plans';
import { usePlans } from '../hooks/use-plans';
import type { PlanStatus } from '@shared/types';

type SortOption = 'date-asc' | 'date-desc' | 'status';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'finalized', label: 'Finalized' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const sortOptions = [
  { value: 'date-desc', label: 'Date (Newest)' },
  { value: 'date-asc', label: 'Date (Oldest)' },
  { value: 'status', label: 'Status' },
];

const statusSortOrder: Record<PlanStatus, number> = {
  finalized: 0,
  draft: 1,
  completed: 2,
  cancelled: 3,
};

export function Plans(): JSX.Element {
  const { plans, isLoading, error, fetchPlans } = usePlans({ autoFetch: true });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const filteredAndSortedPlans = useMemo(() => {
    let result = [...plans];

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((plan) => plan.status === statusFilter);
    }

    // Filter by date range
    if (dateFrom) {
      result = result.filter((plan) => plan.activationDate >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((plan) => plan.activationDate <= dateTo);
    }

    // Sort
    switch (sortOption) {
      case 'date-desc':
        result.sort((a, b) => b.activationDate.localeCompare(a.activationDate));
        break;
      case 'date-asc':
        result.sort((a, b) => a.activationDate.localeCompare(b.activationDate));
        break;
      case 'status':
        result.sort((a, b) => statusSortOrder[a.status] - statusSortOrder[b.status]);
        break;
    }

    return result;
  }, [plans, statusFilter, sortOption, dateFrom, dateTo]);

  const hasFilters = statusFilter !== 'all' || dateFrom !== '' || dateTo !== '';

  const clearFilters = (): void => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Plans</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your activation plans
          </p>
        </div>
        <Link to="/plans/new">
          <Button>
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
              className="mr-1"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Plan
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <Select
              label="Status"
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>

          <div className="w-40">
            <Input
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="w-40">
            <Input
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="w-40">
            <Select
              label="Sort By"
              options={sortOptions}
              value={sortOption}
              onChange={(value) => setSortOption(value as SortOption)}
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
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
                className="mr-1"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 p-4">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-error-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-medium text-error-700 dark:text-error-300">Failed to load plans</p>
              <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void fetchPlans()} className="ml-auto">
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && <PlanCardSkeletonList count={4} />}

      {/* Empty State - No plans at all */}
      {!isLoading && !error && plans.length === 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Plans Yet</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Create your first activation plan to get started.
              </p>
              <Link to="/plans/new" className="mt-4 inline-block">
                <Button size="sm">Create Your First Plan</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - Filtered results */}
      {!isLoading && !error && plans.length > 0 && filteredAndSortedPlans.length === 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Matching Plans</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Try adjusting your filters to find what you are looking for.
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3">
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Plans List */}
      {!isLoading && !error && filteredAndSortedPlans.length > 0 && (
        <div className="space-y-4">
          {filteredAndSortedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
