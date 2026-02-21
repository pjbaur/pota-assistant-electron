/**
 * Profile Settings Section
 *
 * Allows users to configure their amateur radio profile:
 * - Callsign
 * - Grid square (Maidenhead locator)
 * - Default location coordinates
 */

import { useState, useEffect, useCallback } from 'react';
import { Button, Input } from '../ui';
import { useIPC } from '../../hooks';
import { useUIStore } from '../../stores/ui-store';
import type { UserConfig } from '../../../shared/types/config';

/** Validates amateur radio callsign format */
function isValidCallsign(callsign: string): boolean {
  // Amateur radio callsigns: 1-2 letter prefix, 1-3 digits, 1-3 letter suffix
  // Examples: K1ABC, W1AW, VE3XYZ, DL5XX, G4ABC
  const callsignRegex = /^[A-Za-z]{1,2}[0-9][A-Za-z0-9]{0,5}$/;
  return callsignRegex.test(callsign.toUpperCase());
}

/** Validates 6-character Maidenhead grid square format */
function isValidGridSquare(grid: string): boolean {
  // Maidenhead locator: 2 uppercase letters + 2 digits + 2 lowercase letters
  // Example: DN44xk
  const gridRegex = /^[A-Za-z]{2}[0-9]{2}[A-Za-z]{2}$/;
  return gridRegex.test(grid);
}

/** Validates latitude (-90 to 90) */
function isValidLatitude(lat: string): boolean {
  const num = parseFloat(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
}

/** Validates longitude (-180 to 180) */
function isValidLongitude(lon: string): boolean {
  const num = parseFloat(lon);
  return !isNaN(num) && num >= -180 && num <= 180;
}

export function ProfileSection(): JSX.Element {
  const { invoke } = useIPC();
  const addToast = useUIStore((state) => state.addToast);

  const [callsign, setCallsign] = useState('');
  const [gridSquare, setGridSquare] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Validation states
  const [callsignError, setCallsignError] = useState<string | null>(null);
  const [gridError, setGridError] = useState<string | null>(null);
  const [latError, setLatError] = useState<string | null>(null);
  const [lonError, setLonError] = useState<string | null>(null);

  // Load existing config on mount
  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      setIsLoading(true);
      const result = await invoke('config:get', {});

      if (result.success && result.data) {
        const config = result.data as UserConfig;
        setCallsign(config.callsign ?? '');
        setGridSquare(config.homeGridSquare ?? '');
        // Note: lat/lon would come from config if available
        // For now, leaving empty as they're not in UserConfig type yet
      }

      setIsLoading(false);
    };

    void loadConfig();
  }, [invoke]);

  // Validate callsign on change
  const handleCallsignChange = useCallback((value: string) => {
    setCallsign(value.toUpperCase());
    if (value && !isValidCallsign(value)) {
      setCallsignError('Invalid callsign format (e.g., K1ABC)');
    } else {
      setCallsignError(null);
    }
  }, []);

  // Validate grid square on change
  const handleGridSquareChange = useCallback((value: string) => {
    setGridSquare(value);
    if (value && !isValidGridSquare(value)) {
      setGridError('Invalid format (6 chars, e.g., DN44xk)');
    } else {
      setGridError(null);
    }
  }, []);

  // Validate latitude on change
  const handleLatitudeChange = useCallback((value: string) => {
    setLatitude(value);
    if (value && !isValidLatitude(value)) {
      setLatError('Must be between -90 and 90');
    } else {
      setLatError(null);
    }
  }, []);

  // Validate longitude on change
  const handleLongitudeChange = useCallback((value: string) => {
    setLongitude(value);
    if (value && !isValidLongitude(value)) {
      setLonError('Must be between -180 and 180');
    } else {
      setLonError(null);
    }
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    // Validate all fields before saving
    let hasErrors = false;

    if (callsign && !isValidCallsign(callsign)) {
      setCallsignError('Invalid callsign format');
      hasErrors = true;
    }

    if (gridSquare && !isValidGridSquare(gridSquare)) {
      setGridError('Invalid grid square format');
      hasErrors = true;
    }

    if (latitude && !isValidLatitude(latitude)) {
      setLatError('Invalid latitude');
      hasErrors = true;
    }

    if (longitude && !isValidLongitude(longitude)) {
      setLonError('Invalid longitude');
      hasErrors = true;
    }

    if (hasErrors) {
      addToast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        variant: 'error',
      });
      return;
    }

    setIsSaving(true);

    const updates: Record<string, string | undefined> = {
      callsign: callsign || undefined,
      homeGridSquare: gridSquare || undefined,
      // Note: latitude/longitude would be saved here if added to config
    };

    const result = await invoke('config:set', { updates });

    setIsSaving(false);

    if (result.success) {
      addToast({
        title: 'Settings Saved',
        description: 'Your profile has been updated',
        variant: 'success',
      });
    } else {
      addToast({
        title: 'Save Failed',
        description: result.error ?? 'Failed to save settings',
        variant: 'error',
      });
    }
  }, [callsign, gridSquare, latitude, longitude, invoke, addToast]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile</h2>
        <div className="mt-4 flex items-center justify-center py-8">
          <svg className="h-6 w-6 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Your amateur radio operator information
      </p>

      <div className="mt-6 space-y-4">
        <div className="max-w-sm">
          <Input
            label="Callsign"
            placeholder="e.g., K1ABC"
            value={callsign}
            onChange={(e) => handleCallsignChange(e.target.value)}
            variant={callsignError ? 'error' : 'default'}
            helperText={callsignError ?? 'Your amateur radio callsign'}
          />
        </div>

        <div className="max-w-sm">
          <Input
            label="Grid Square"
            placeholder="e.g., DN44xk"
            value={gridSquare}
            onChange={(e) => handleGridSquareChange(e.target.value.toUpperCase())}
            variant={gridError ? 'error' : 'default'}
            helperText={gridError ?? '6-character Maidenhead locator'}
            maxLength={6}
          />
        </div>

        <div className="grid max-w-md gap-4 sm:grid-cols-2">
          <Input
            label="Default Latitude"
            placeholder="e.g., 40.7128"
            value={latitude}
            onChange={(e) => handleLatitudeChange(e.target.value)}
            variant={latError ? 'error' : 'default'}
            helperText={latError ?? 'Decimal degrees'}
            type="number"
            step="0.0001"
          />
          <Input
            label="Default Longitude"
            placeholder="e.g., -74.0060"
            value={longitude}
            onChange={(e) => handleLongitudeChange(e.target.value)}
            variant={lonError ? 'error' : 'default'}
            helperText={lonError ?? 'Decimal degrees'}
            type="number"
            step="0.0001"
          />
        </div>

        <div className="pt-2">
          <Button
            onClick={() => void handleSave()}
            isLoading={isSaving}
            disabled={!!(callsignError ?? gridError ?? latError ?? lonError)}
          >
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfileSection;
