import { ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui';
import type { WizardStep } from '../../../stores/plan-store';

export const WIZARD_STEPS: { step: WizardStep; label: string }[] = [
  { step: 'park', label: 'Select Park' },
  { step: 'datetime', label: 'Date & Time' },
  { step: 'equipment', label: 'Equipment' },
  { step: 'bands', label: 'Bands' },
  { step: 'review', label: 'Review' },
];

export interface WizardContainerProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  children: ReactNode;
  canProceed: boolean;
  isEditing?: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  onCreate: () => void;
  onGoToStep: (step: WizardStep) => void;
}

export function WizardContainer({
  currentStep,
  completedSteps,
  children,
  canProceed,
  isEditing = false,
  onBack,
  onNext,
  onCancel,
  onCreate,
  onGoToStep,
}: WizardContainerProps): JSX.Element {
  const navigate = useNavigate();
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.step === currentStep);
  const isLastStep = currentStep === 'review';
  const isFirstStep = currentStep === 'park';

  const handleCancel = useCallback(() => {
    onCancel();
    navigate('/plans');
  }, [onCancel, navigate]);

  return (
    <div className="space-y-6">
      {/* Step Indicators */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((wizardStep, index) => {
              const isActive = currentStep === wizardStep.step;
              const isComplete = completedSteps.includes(wizardStep.step);
              const stepNumber = index + 1;

              return (
                <div key={wizardStep.step} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => (isComplete || isActive ? onGoToStep(wizardStep.step) : undefined)}
                    disabled={!isComplete && !isActive}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : isComplete
                          ? 'cursor-pointer bg-success-500 text-white hover:bg-success-600'
                          : 'cursor-not-allowed bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {isComplete ? (
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
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </button>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : isComplete
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {wizardStep.label}
                  </span>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`absolute h-0.5 w-16 translate-x-14 transform ${
                        index < currentIndex ? 'bg-success-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      style={{ top: '2.5rem', zIndex: -1 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">{children}</div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-700">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>

          <div className="flex gap-3">
            {!isFirstStep && (
              <Button variant="secondary" onClick={onBack}>
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
                  className="mr-1"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back
              </Button>
            )}

            {isLastStep ? (
              <Button variant="primary" onClick={onCreate} disabled={!canProceed}>
                {isEditing ? 'Update Plan' : 'Create Plan'}
              </Button>
            ) : (
              <Button variant="primary" onClick={onNext} disabled={!canProceed}>
                Next
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
                  className="ml-1"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
