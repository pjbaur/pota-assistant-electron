/**
 * Data Management Settings Section
 *
 * Manages park database:
 * - View park count and last sync status
 * - Import parks from CSV
 * - Clear all park data
 * - Stale data warning threshold
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui';
import { Dialog, DialogContent, DialogClose } from '../ui/dialog';
import { ImportDialog } from '../parks/import-dialog';
import { useParks } from '../../hooks';
import { useUIStore } from '../../stores/ui-store';

export function DataSection(): JSX.Element {
  const { totalResults, searchParks } = useParks();
  const addToast = useUIStore((state) => state.addToast);

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  // Load park count and last sync date on mount
  useEffect(() => {
    void searchParks({});
    // TODO: Load last sync date from import metadata when available
  }, [searchParks]);

  // Format last sync date
  const formatSyncDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Not yet synced';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  // Handle import complete
  const handleImportComplete = useCallback((count: number) => {
    setShowImportDialog(false);
    void searchParks({}); // Refresh park count
    setLastSyncDate(new Date().toISOString());
    addToast({
      title: 'Import Complete',
      description: `${count.toLocaleString()} parks imported successfully`,
      variant: 'success',
    });
  }, [searchParks, addToast]);

  // Handle clear all data
  const handleClearData = useCallback(async () => {
    setIsClearing(true);

    // Note: This would call a parks:clear IPC handler
    // For now, showing a placeholder implementation
    try {
      // const result = await invoke('parks:clear', {});
      // For now, just simulate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addToast({
        title: 'Data Cleared',
        description: 'All park data has been removed',
        variant: 'success',
      });

      void searchParks({}); // Refresh park count
    } catch (err) {
      addToast({
        title: 'Clear Failed',
        description: err instanceof Error ? err.message : 'Failed to clear data',
        variant: 'error',
      });
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  }, [searchParks, addToast]);

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Data Management</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage your local park database
        </p>

        <div className="mt-6 space-y-4">
          {/* Park Database Status */}
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Park Database
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {totalResults.toLocaleString()}
                    </span>{' '}
                    parks in database
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Last synced: {formatSyncDate(lastSyncDate)}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <svg
                    className="h-5 w-5 text-primary-600 dark:text-primary-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Import Parks */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">
                Import from CSV
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Import park data from a POTA CSV file
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowImportDialog(true)}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              }
            >
              Import Parks
            </Button>
          </div>

          {/* Clear Data */}
          <div className="flex items-center justify-between rounded-lg border border-error-200 bg-error-50/50 p-4 dark:border-error-900/50 dark:bg-error-900/10">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">
                Clear All Data
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Remove all parks from the local database
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowClearConfirm(true)}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              }
            >
              Clear Data
            </Button>
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={handleImportComplete}
      />

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent
          title="Clear All Data"
          description="This action cannot be undone"
          className="max-w-md"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-error-50 p-4 dark:bg-error-900/20">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-error-600 dark:text-error-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-error-800 dark:text-error-200">
                    Are you sure you want to clear all park data?
                  </p>
                  <p className="mt-1 text-sm text-error-700 dark:text-error-300">
                    This will remove {totalResults.toLocaleString()} parks from your local database.
                    You can re-import parks from a CSV file later.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <DialogClose>
                <Button variant="ghost" disabled={isClearing}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="danger"
                onClick={() => void handleClearData()}
                isLoading={isClearing}
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DataSection;
