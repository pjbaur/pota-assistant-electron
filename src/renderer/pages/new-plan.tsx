import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui';
import {
  WizardContainer,
  WIZARD_STEPS,
  StepPark,
  StepDatetime,
  StepEquipment,
  StepBands,
  StepReview,
  type DateTimeData,
} from '../components/plans/wizard';
import { usePlanStore, type WizardStep } from '../stores/plan-store';
import { usePlans, usePlan } from '../hooks/use-plans';
import type { Park, EquipmentPreset, BandId, PlanInput } from '@shared/types';

interface PreviousSelectionsProps {
  currentStep: WizardStep;
  park: Park | null;
  datetime: DateTimeData;
  equipment: EquipmentPreset | null;
}

function formatActivationDate(date: string): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function PreviousSelections({
  currentStep,
  park,
  datetime,
  equipment,
}: PreviousSelectionsProps): JSX.Element | null {
  const showPark = currentStep === 'datetime' || currentStep === 'equipment' || currentStep === 'bands';
  const showDatetime = currentStep === 'equipment' || currentStep === 'bands';
  const showEquipment = currentStep === 'bands';

  if (!showPark && !showDatetime && !showEquipment) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        Selections So Far
      </h3>
      <div className="mt-3 space-y-2 text-sm">
        {showPark && (
          <div className="text-slate-700 dark:text-slate-300">
            <span className="font-medium">Park:</span>{' '}
            {park ? `${park.reference} - ${park.name}` : 'No park selected'}
          </div>
        )}

        {showDatetime && (
          <div className="text-slate-700 dark:text-slate-300">
            <span className="font-medium">Date & Time:</span>{' '}
            {datetime.date
              ? `${formatActivationDate(datetime.date)}, ${datetime.startTime} - ${datetime.endTime}`
              : 'Not set'}
          </div>
        )}

        {showEquipment && (
          <div className="text-slate-700 dark:text-slate-300">
            <span className="font-medium">Equipment:</span>{' '}
            {equipment ? `${equipment.name} (${equipment.powerWatts}W)` : 'Not selected'}
          </div>
        )}
      </div>
    </div>
  );
}

export function NewPlan(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('edit');

  const isEditing = planId !== null;

  const { wizard, setWizardStep, completeWizardStep, resetWizard } = usePlanStore();
  const { createPlan, updatePlan } = usePlans();
  const { plan: existingPlan, fetchPlan } = usePlan(planId);

  // Form state
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [datetime, setDatetime] = useState<DateTimeData>({
    date: '',
    startTime: '09:00',
    endTime: '12:00',
    timeReference: 'park',
  });
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentPreset | null>(null);
  const [selectedBands, setSelectedBands] = useState<BandId[]>([]);
  const [notes, setNotes] = useState('');

  // Load existing plan for editing
  useEffect(() => {
    if (isEditing && planId) {
      void fetchPlan();
    }
  }, [isEditing, planId, fetchPlan]);

  // Populate form when existing plan loads
  useEffect(() => {
    if (existingPlan) {
      // The park needs to be fetched separately or stored with the plan
      // For now, we'll create a minimal park object from the reference
      setSelectedPark({
        reference: existingPlan.parkReference,
        name: existingPlan.name,
        entityId: 'US',
        gridSquare: '' as never,
        latitude: 0,
        longitude: 0,
        programId: '',
        activationCount: 0,
        isFavorite: false,
        updatedAt: '' as never,
      });
      setDatetime({
        date: existingPlan.activationDate,
        startTime: existingPlan.startTime,
        endTime: existingPlan.endTime,
        timeReference: 'park',
      });
      setSelectedEquipment(existingPlan.equipmentPreset ?? null);
      setSelectedBands(existingPlan.bands ?? []);
      setNotes(existingPlan.notes ?? '');
    }
  }, [existingPlan]);

  // Reset wizard on unmount
  useEffect(() => {
    return () => {
      resetWizard();
    };
  }, [resetWizard]);

  const handleCancel = useCallback(() => {
    resetWizard();
  }, [resetWizard]);

  const handleGoToStep = useCallback(
    (step: WizardStep) => {
      setWizardStep(step);
    },
    [setWizardStep]
  );

  // Validation for each step
  const canProceed = useMemo(() => {
    switch (wizard.currentStep) {
      case 'park':
        return selectedPark !== null;
      case 'datetime':
        return datetime.date !== '' && datetime.startTime !== '' && datetime.endTime !== '';
      case 'equipment':
        return true; // Equipment is optional
      case 'bands':
        return selectedBands.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  }, [wizard.currentStep, selectedPark, datetime, selectedBands]);

  const handleNext = useCallback(() => {
    completeWizardStep(wizard.currentStep);
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.step === wizard.currentStep);
    const nextStep = WIZARD_STEPS[currentIndex + 1];
    if (nextStep) {
      setWizardStep(nextStep.step);
    }
  }, [wizard.currentStep, completeWizardStep, setWizardStep]);

  const handleBack = useCallback(() => {
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.step === wizard.currentStep);
    const prevStep = WIZARD_STEPS[currentIndex - 1];
    if (prevStep) {
      setWizardStep(prevStep.step);
    }
  }, [wizard.currentStep, setWizardStep]);

  const handleCreate = useCallback(() => {
    if (!selectedPark) return;

    const planData: PlanInput = {
      name: `${selectedPark.name} Activation`,
      parkReference: selectedPark.reference,
      activationDate: datetime.date as never,
      startTime: datetime.startTime,
      endTime: datetime.endTime,
      equipmentPreset: selectedEquipment ?? undefined,
      bands: selectedBands,
      timeSlots: [],
      notes: notes || undefined,
    };

    void (async () => {
      try {
        if (isEditing && planId) {
          await updatePlan(planId, planData);
        } else {
          const newPlan = await createPlan(planData);
          if (!newPlan) {
            throw new Error('Failed to create plan');
          }
        }
        resetWizard();
        navigate('/plans');
      } catch (error) {
        console.error('Failed to save plan:', error);
      }
    })();
  }, [
    selectedPark,
    datetime,
    selectedEquipment,
    selectedBands,
    notes,
    isEditing,
    planId,
    createPlan,
    updatePlan,
    resetWizard,
    navigate,
  ]);

  const handleParkSelect = useCallback((park: Park) => {
    setSelectedPark(park);
  }, []);

  const handleDatetimeChange = useCallback((data: DateTimeData) => {
    setDatetime(data);
  }, []);

  const handlePresetSelect = useCallback((preset: EquipmentPreset) => {
    setSelectedEquipment(preset);
  }, []);

  const handleBandsChange = useCallback((bands: BandId[]) => {
    setSelectedBands(bands);
  }, []);

  const handleNotesChange = useCallback((newNotes: string) => {
    setNotes(newNotes);
  }, []);

  const renderStep = () => {
    switch (wizard.currentStep) {
      case 'park':
        return <StepPark selectedPark={selectedPark} onParkSelect={handleParkSelect} />;
      case 'datetime':
        return (
          <StepDatetime
            data={datetime}
            onChange={handleDatetimeChange}
            parkTimezone={selectedPark?.timezone}
          />
        );
      case 'equipment':
        return (
          <StepEquipment selectedPreset={selectedEquipment} onPresetSelect={handlePresetSelect} />
        );
      case 'bands':
        return <StepBands selectedBands={selectedBands} onBandsChange={handleBandsChange} />;
      case 'review':
        return (
          <StepReview
            park={selectedPark}
            datetime={datetime}
            equipment={selectedEquipment}
            bands={selectedBands}
            notes={notes}
            onNotesChange={handleNotesChange}
            onEditStep={handleGoToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/plans">
          <Button variant="ghost" size="sm">
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
            Back to Plans
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Activation Plan' : 'New Activation Plan'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {isEditing
              ? 'Modify your activation plan details'
              : 'Create a new activation plan using the step-by-step wizard'}
          </p>
        </div>
      </div>

      <WizardContainer
        currentStep={wizard.currentStep}
        completedSteps={wizard.completedSteps}
        canProceed={canProceed}
        isEditing={isEditing}
        onBack={handleBack}
        onNext={handleNext}
        onCancel={handleCancel}
        onCreate={handleCreate}
        onGoToStep={handleGoToStep}
      >
        <div className="space-y-6">
          <PreviousSelections
            currentStep={wizard.currentStep}
            park={selectedPark}
            datetime={datetime}
            equipment={selectedEquipment}
          />
          {renderStep()}
        </div>
      </WizardContainer>
    </div>
  );
}
