import { Input } from '../components/ui';

export function Parks(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parks</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Discover and explore POTA parks
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <div className="mb-6">
          <Input
            placeholder="Search parks by name, reference, or location..."
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
          />
        </div>

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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Park Discovery Coming Soon
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Search and browse the POTA database to find your next activation location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
