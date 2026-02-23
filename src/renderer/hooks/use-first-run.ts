/**
 * First-run detection hook
 *
 * Determines if this is the user's first time running the application
 * by checking both the config flag and whether any parks exist in the database.
 */

import { useState, useEffect, useCallback } from 'react';
import { useIPC } from './use-ipc';
import type { UserConfig } from '@shared/types/config';

interface FirstRunState {
  /** True if this is the first time the app has been run */
  isFirstRun: boolean;
  /** Loading state while checking first-run status */
  isLoading: boolean;
  /** Mark onboarding as complete */
  completeOnboarding: () => Promise<void>;
}

/** Type guard to check if config is a full UserConfig object */
function isUserConfig(data: unknown): data is UserConfig {
  return typeof data === 'object' && data !== null && 'theme' in data;
}

export function useFirstRun(): FirstRunState {
  const { invoke } = useIPC();
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check first-run status on mount
  useEffect(() => {
    const checkFirstRun = async (): Promise<void> => {
      setIsLoading(true);

      try {
        // Check if onboarding has been completed in config
        const configResult = await invoke('config:get', {});

        if (configResult.success && configResult.data) {
          // When called without a key, config:get returns full UserConfig
          if (isUserConfig(configResult.data)) {
            // If onboarding already completed, not first run
            if (configResult.data.hasCompletedOnboarding === true) {
              setIsFirstRun(false);
              setIsLoading(false);
              return;
            }
          }
        }

        // Check if any parks exist in the database
        const parksResult = await invoke('parks:search', {
          limit: 1,
          offset: 0,
        });

        if (parksResult.success && parksResult.data) {
          // If no parks in database and onboarding not completed, it's first run
          const hasParks = parksResult.data.total > 0;
          setIsFirstRun(!hasParks);
        } else {
          // If we can't check parks, default to showing onboarding
          setIsFirstRun(true);
        }
      } catch (error) {
        console.error('Error checking first-run status:', error);
        // On error, default to showing onboarding to be safe
        setIsFirstRun(true);
      } finally {
        setIsLoading(false);
      }
    };

    void checkFirstRun();
  }, [invoke]);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(async (): Promise<void> => {
    try {
      await invoke('config:set', {
        updates: { hasCompletedOnboarding: true },
      });
      setIsFirstRun(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still mark as not first run in local state even if persist fails
      setIsFirstRun(false);
    }
  }, [invoke]);

  return {
    isFirstRun,
    isLoading,
    completeOnboarding,
  };
}
