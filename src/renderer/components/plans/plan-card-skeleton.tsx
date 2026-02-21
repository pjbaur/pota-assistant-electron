export function PlanCardSkeleton(): JSX.Element {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />

          <div className="flex flex-wrap items-center gap-4">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>

        <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

interface PlanCardSkeletonListProps {
  count?: number;
}

export function PlanCardSkeletonList({ count = 3 }: PlanCardSkeletonListProps): JSX.Element {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <PlanCardSkeleton key={index} />
      ))}
    </div>
  );
}
