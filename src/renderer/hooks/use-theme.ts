import { useEffect, useCallback } from 'react';
import { useUIStore, initializeTheme } from '../stores/ui-store';
import type { Theme } from '../stores/ui-store';

export function useTheme(): {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
} {
  const { theme, resolvedTheme, setTheme } = useUIStore();

  useEffect(() => {
    initializeTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (): void => {
        const newResolvedTheme = mediaQuery.matches ? 'dark' : 'light';
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newResolvedTheme);
        useUIStore.setState({ resolvedTheme: newResolvedTheme });
      };

      mediaQuery.addEventListener('change', handleChange);

      return (): void => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
    return undefined;
  }, [theme]);

  const toggleTheme = useCallback((): void => {
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    if (nextTheme !== undefined) {
      setTheme(nextTheme);
    }
  }, [theme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
  };
}
