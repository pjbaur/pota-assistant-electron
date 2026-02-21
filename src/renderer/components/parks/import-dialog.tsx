/**
 * Park CSV Import Dialog
 *
 * Provides a UI for importing POTA park data from CSV files.
 */

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import type { CsvImportStatus } from '../../../shared/types/park';

/** Props for the ImportDialog component */
export interface ImportDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when import completes successfully */
  onImportComplete?: (count: number) => void;
}

/** Import phase state */
type ImportPhase = 'idle' | 'selecting' | 'importing' | 'success' | 'error';

/** Error detail for display */
interface ImportError {
  lineNumber: number;
  errors: string[];
}

/**
 * Dialog for importing park data from CSV files
 */
export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps): JSX.Element {
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [progress, setProgress] = useState<CsvImportStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  // Subscribe to import progress events
  useEffect(() => {
    if (!open) return;

    const unsubscribe = window.electronAPI.on<CsvImportStatus>(
      'event:parks:import:progress',
      (data) => {
        setProgress(data);
        if (data.phase === 'error') {
          setPhase('error');
          setError(data.error ?? 'Unknown error');
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPhase('idle');
      setFilePath(null);
      setProgress(null);
      setError(null);
      setImportErrors([]);
      setImportedCount(0);
      setSkippedCount(0);
    }
  }, [open]);

  // Handle file selection
  const handleSelectFile = useCallback(async () => {
    setPhase('selecting');
    setError(null);

    try {
      const result = await window.electronAPI.invoke('system:select:csv', undefined);

      if (!result.success) {
        setPhase('error');
        setError(result.error ?? 'Failed to open file dialog');
        return;
      }

      if (result.data && 'canceled' in result.data && result.data.canceled) {
        setPhase('idle');
        return;
      }

      if (result.data && 'filePath' in result.data && result.data.filePath) {
        setFilePath(result.data.filePath);
        setPhase('idle');
      } else {
        setPhase('idle');
      }
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Failed to select file');
    }
  }, []);

  // Handle import start
  const handleImport = useCallback(async () => {
    if (filePath === null) return;

    setPhase('importing');
    setError(null);
    setImportErrors([]);

    try {
      const result = await window.electronAPI.invoke('parks:import:csv', { filePath });

      if (!result.success) {
        setPhase('error');
        setError(result.error ?? 'Import failed');
        return;
      }

      const data = result.data as {
        imported: number;
        skipped: number;
        totalRows: number;
        validRows: number;
        invalidRows: number;
        errors: ImportError[];
      };

      setImportedCount(data.imported);
      setSkippedCount(data.skipped);
      setImportErrors(data.errors ?? []);
      setPhase('success');

      if (onImportComplete !== undefined) {
        onImportComplete(data.imported);
      }
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  }, [filePath, onImportComplete]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Render progress bar
  const renderProgressBar = (): JSX.Element | null => {
    if (progress === null || progress.totalRecords === 0) return null;

    const percentage = Math.round((progress.recordsProcessed / progress.totalRecords) * 100);

    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
          <span>{getPhaseLabel(progress.phase)}</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-2 rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {progress.recordsProcessed.toLocaleString()} of {progress.totalRecords.toLocaleString()} records
        </p>
      </div>
    );
  };

  // Get human-readable phase label
  const getPhaseLabel = (phaseLabel: string): string => {
    switch (phaseLabel) {
      case 'reading':
        return 'Reading file...';
      case 'parsing':
        return 'Parsing CSV...';
      case 'importing':
        return 'Importing to database...';
      case 'completed':
        return 'Complete!';
      case 'error':
        return 'Error';
      default:
        return 'Preparing...';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Import Park Data"
        description="Import parks from a POTA CSV file"
        className="max-w-lg"
      >
        {/* File Selection */}
        {phase === 'idle' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => void handleSelectFile()}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Select CSV File
              </Button>
              {filePath !== null && (
                <span className="flex-1 truncate text-sm text-slate-600 dark:text-slate-400">
                  {filePath.split('/').pop() ?? filePath}
                </span>
              )}
            </div>

            {filePath !== null && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={() => void handleImport()}>
                  Start Import
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Selecting State */}
        {phase === 'selecting' && (
          <div className="flex items-center justify-center py-8">
            <svg className="h-6 w-6 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {/* Importing State */}
        {phase === 'importing' && (
          <div className="py-4">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Importing parks...
              </span>
            </div>
            {renderProgressBar()}
          </div>
        )}

        {/* Success State */}
        {phase === 'success' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-success-50 p-4 dark:bg-success-900/20">
              <svg className="h-5 w-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-success-800 dark:text-success-200">
                  Import Complete!
                </p>
                <p className="mt-1 text-sm text-success-700 dark:text-success-300">
                  Successfully imported {importedCount.toLocaleString()} parks
                  {skippedCount > 0 && (
                    <span>, {skippedCount.toLocaleString()} skipped</span>
                  )}
                </p>
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {importErrors.length} row{importErrors.length !== 1 ? 's' : ''} had errors
                </p>
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm text-amber-700 dark:text-amber-300">
                  {importErrors.slice(0, 10).map((err, index) => (
                    <li key={index}>
                      Row {err.lineNumber}: {err.errors.join(', ')}
                    </li>
                  ))}
                  {importErrors.length > 10 && (
                    <li className="font-medium">
                      ...and {importErrors.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <DialogClose>
                <Button>Close</Button>
              </DialogClose>
            </div>
          </div>
        )}

        {/* Error State */}
        {phase === 'error' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-error-50 p-4 dark:bg-error-900/20">
              <svg className="h-5 w-5 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div>
                <p className="font-medium text-error-800 dark:text-error-200">
                  Import Failed
                </p>
                <p className="mt-1 text-sm text-error-700 dark:text-error-300">
                  {error ?? 'An unexpected error occurred'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setPhase('idle')}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ImportDialog;
