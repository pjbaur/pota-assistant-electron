import type { ReactNode } from 'react';
import { useTheme } from '../../hooks/use-theme';
import { Tooltip } from '../ui/tooltip';

export interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// Check if running on macOS for traffic light spacing
const isMacOS = (): boolean => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps): JSX.Element {
  const { theme, setTheme, isDark } = useTheme();

  const cycleTheme = (): void => {
    const themeOrder: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    if (nextTheme !== undefined) {
      setTheme(nextTheme);
    }
  };

  const getThemeIcon = (): ReactNode => {
    if (theme === 'system') {
      return (
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
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    }

    if (isDark) {
      return (
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
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    }

    return (
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
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    );
  };

  const getThemeLabel = (): string => {
    if (theme === 'system') return 'System theme';
    if (isDark) return 'Dark theme';
    return 'Light theme';
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 ${
        isMacOS() ? 'pl-20' : ''
      }`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
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
          >
            {sidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            POTA Planner
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <Tooltip content={getThemeLabel()}>
          <button
            onClick={cycleTheme}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {getThemeIcon()}
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
