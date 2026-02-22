/**
 * DataFreshness Component
 *
 * Displays how long ago weather data was fetched.
 * Shows a warning if data is stale (> 30 minutes old).
 */

import { useMemo } from 'react';

export interface DataFreshnessProps {
  fetchedAt: string;
  className?: string;
}

/**
 * Calculate relative time from now
 */
function getRelativeTime(isoString: string): { text: string; isStale: boolean } {
  const fetchedAt = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - fetchedAt.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  const isStale = diffMinutes > 30;

  if (diffMinutes < 1) {
    return { text: 'just now', isStale: false };
  }

  if (diffMinutes < 60) {
    return {
      text: `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`,
      isStale,
    };
  }

  if (diffHours < 24) {
    return {
      text: `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`,
      isStale: true,
    };
  }

  return {
    text: fetchedAt.toLocaleDateString(),
    isStale: true,
  };
}

export function DataFreshness({ fetchedAt, className = '' }: DataFreshnessProps): JSX.Element {
  const { text, isStale } = useMemo(() => getRelativeTime(fetchedAt), [fetchedAt]);

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      {isStale ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-500"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-amber-600 dark:text-amber-400">
            Updated {text}
          </span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-500"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-slate-500 dark:text-slate-400">
            Updated {text}
          </span>
        </>
      )}
    </div>
  );
}
