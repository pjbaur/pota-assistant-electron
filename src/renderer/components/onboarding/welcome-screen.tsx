/**
 * Welcome Screen Component
 *
 * First-run onboarding experience that introduces users to the app's features
 * and guides them to import park data.
 */

import { useState, useCallback } from 'react';
import { Button } from '../ui';
import { ImportDialog } from '../parks/import-dialog';
import { useUIStore } from '../../stores/ui-store';

interface WelcomeScreenProps {
  onComplete: () => void | Promise<void>;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps): JSX.Element {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const addToast = useUIStore((state) => state.addToast);

  const handleGetStarted = useCallback(() => {
    setIsCompleting(true);
    void Promise.resolve(onComplete()).finally(() => {
      setIsCompleting(false);
    });
  }, [onComplete]);

  const handleImportComplete = useCallback(
    (count: number) => {
      setShowImportDialog(false);
      addToast({
        title: 'Parks Imported',
        description: `${count.toLocaleString()} parks have been imported successfully`,
        variant: 'success',
      });
      // Auto-complete onboarding after successful import
      void onComplete();
    },
    [onComplete, addToast]
  );

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800 sm:p-12">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <svg
                className="h-8 w-8 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome to POTA Activation Planner
            </h1>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
              Your companion for planning Parks on the Air activations
            </p>
          </div>

          {/* Features */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <FeatureCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              }
              title="Park Discovery"
              description="Browse and search thousands of POTA parks with detailed location and entity information"
            />
            <FeatureCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              }
              title="Weather Forecasts"
              description="View detailed weather conditions for your planned activation location"
            />
            <FeatureCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
              title="Band Recommendations"
              description="Get intelligent band and propagation suggestions based on current conditions"
            />
            <FeatureCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              }
              title="Equipment Presets"
              description="Save and reuse your favorite radio and antenna configurations"
            />
          </div>

          {/* Import prompt */}
          <div className="mt-10 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-600 dark:bg-slate-800/50">
            <svg
              className="mx-auto h-10 w-10 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
              Get Started with Park Data
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Import parks from a POTA CSV file to start planning your activations.
              Download park data from{' '}
              <a
                href="https://pota.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline dark:text-primary-400"
              >
                pota.app
              </a>
              .
            </p>
            <Button
              variant="secondary"
              className="mt-4"
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

          {/* Get Started button */}
          <div className="mt-10 text-center">
            <Button
              size="lg"
              onClick={() => void handleGetStarted()}
              isLoading={isCompleting}
            >
              Get Started
            </Button>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              You can always import parks later from Settings
            </p>
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}

/** Feature card sub-component */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}): JSX.Element {
  return (
    <div className="flex items-start gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export default WelcomeScreen;
