import { useTheme } from '../hooks';
import { Select } from '../components/ui';

export function Settings(): JSX.Element {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Configure your preferences
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2>
        <div className="mt-4 space-y-4">
          <div className="max-w-xs">
            <Select
              label="Theme"
              options={themeOptions}
              value={theme}
              onChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Choose your preferred color scheme
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Data</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">Park Database</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Last synced: Not yet synced
              </p>
            </div>
            <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">
              Sync Now
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">About</h2>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            POTA Activation Planner v0.1.0
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            A desktop application for planning Parks on the Air activations.
          </p>
        </div>
      </div>
    </div>
  );
}
