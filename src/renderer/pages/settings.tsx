/**
 * Settings Page
 *
 * Main settings page with sections:
 * - Profile (callsign, location)
 * - Appearance (theme)
 * - Units (temperature)
 * - Data Management (park import, clear data)
 * - About (app version, credits)
 */

import { useTheme, useUnits } from '../hooks';
import { Select } from '../components/ui';
import { ProfileSection, DataSection } from '../components/settings';

export function Settings(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const { temperatureUnit, setTemperatureUnit } = useUnits();

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  const temperatureOptions = [
    { value: 'celsius', label: 'Celsius (°C)' },
    { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Configure your preferences
        </p>
      </div>

      {/* Profile Section */}
      <ProfileSection />

      {/* Appearance Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Customize the look and feel
        </p>

        <div className="mt-6 space-y-4">
          <div className="max-w-xs">
            <Select
              label="Theme"
              options={themeOptions}
              value={theme}
              onChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Choose your preferred color scheme
            </p>
          </div>
        </div>
      </div>

      {/* Units Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Units</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Set your preferred measurement units
        </p>

        <div className="mt-6 space-y-4">
          <div className="max-w-xs">
            <Select
              label="Temperature"
              options={temperatureOptions}
              value={temperatureUnit}
              onChange={(value) => setTemperatureUnit(value as 'celsius' | 'fahrenheit')}
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Choose how temperatures are displayed
            </p>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <DataSection />

      {/* About Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">About</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Application information
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <svg
                className="h-6 w-6 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                POTA Activation Planner
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Version 0.1.0</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              A desktop application for planning Parks on the Air (POTA) activations.
              Consolidates park discovery, weather forecasts, and equipment management
              into an intuitive planning workflow.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Resources</h4>
            <div className="mt-2 flex flex-wrap gap-3">
              <a
                href="https://pota.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                POTA Website
              </a>
              <a
                href="https://docs.pota.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                POTA Docs
              </a>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <p>Made with care for the amateur radio community.</p>
            <p className="mt-1">
              Park data provided by{' '}
              <a
                href="https://pota.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline dark:text-primary-400"
              >
                Parks on the Air
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
