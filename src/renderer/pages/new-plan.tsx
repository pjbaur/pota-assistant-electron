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

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface TimeParts {
  hours: number;
  minutes: number;
}

interface DateTimeSummary {
  localLabel: string;
  localTimezoneInfo: string;
  localDate: string;
  localTimeRange: string;
  utcDate: string;
  utcTimeRange: string;
}

function parseDate(dateStr: string): DateParts | null {
  const parts = dateStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    parts.length !== 3
  ) {
    return null;
  }

  return { year, month, day };
}

function parseTime(timeStr: string): TimeParts | null {
  const parts = timeStr.split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || parts.length !== 2) {
    return null;
  }

  return { hours, minutes };
}

function formatDateParts(date: DateParts): string {
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function formatDateInZone(timestampMs: number, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date(timestampMs));
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return '';
  }

  return formatDateParts({ year, month, day });
}

function formatLongDateInZone(timestampMs: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestampMs));
}

function formatTimeInZone(timestampMs: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestampMs));
}

function parseOffsetMinutes(offsetLabel: string): number | null {
  if (offsetLabel === 'GMT' || offsetLabel === 'UTC') {
    return 0;
  }

  const match = offsetLabel.match(/(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) {
    return null;
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return sign * (hours * 60 + minutes);
}

function getOffsetMinutesAt(timestampMs: number, timezone: string): number | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date(timestampMs));
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    return parseOffsetMinutes(offset);
  } catch {
    return null;
  }
}

function toUtcTimestamp(date: string, time: string, timezone: string): number | null {
  const dateParts = parseDate(date);
  const timeParts = parseTime(time);

  if (!dateParts || !timeParts) {
    return null;
  }

  const baseUtc = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hours,
    timeParts.minutes,
    0,
    0
  );

  if (timezone === 'UTC') {
    return baseUtc;
  }

  const firstOffset = getOffsetMinutesAt(baseUtc, timezone);
  if (firstOffset === null) {
    return baseUtc;
  }

  let adjusted = baseUtc - firstOffset * 60_000;
  const secondOffset = getOffsetMinutesAt(adjusted, timezone);
  if (secondOffset !== null && secondOffset !== firstOffset) {
    adjusted = baseUtc - secondOffset * 60_000;
  }

  return adjusted;
}

function timeToMinutes(time: string): number {
  const parts = parseTime(time);
  if (!parts) {
    return 0;
  }

  return parts.hours * 60 + parts.minutes;
}

function addDays(date: string, days: number): string {
  const parts = parseDate(date);
  if (!parts) {
    return date;
  }

  const value = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatDateInZone(value.getTime(), 'UTC');
}

function getLocalSummaryLabel(park: Park | null): string {
  if (park?.timezone) {
    return 'Park Time';
  }

  return 'Local Time';
}

/**
 * Get timezone abbreviation (e.g., "MST", "EST")
 */
function getTimezoneAbbreviation(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(new Date());
    const tzNamePart = parts.find((p) => p.type === 'timeZoneName');
    return tzNamePart?.value ?? '';
  } catch {
    return '';
  }
}

/**
 * Get UTC offset string (e.g., "UTC-7", "UTC+5:30")
 */
function getUtcOffset(timezone: string): string {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const diffMinutes = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);

    const hours = Math.floor(Math.abs(diffMinutes) / 60);
    const minutes = Math.abs(diffMinutes) % 60;
    const sign = diffMinutes >= 0 ? '+' : '-';

    if (minutes === 0) {
      return `UTC${sign}${hours}`;
    }
    return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
  } catch {
    return 'UTC?';
  }
}

/**
 * Format timezone info for display (abbreviation and UTC offset)
 */
function formatTimezoneInfo(timezone: string | undefined): string {
  if (!timezone) return '';
  const abbreviation = getTimezoneAbbreviation(timezone);
  const offset = getUtcOffset(timezone);
  if (abbreviation && offset) {
    return ` (${abbreviation}, ${offset})`;
  }
  return '';
}

function buildDateTimeSummary(datetime: DateTimeData, park: Park | null): DateTimeSummary | null {
  if (!datetime.date || !datetime.startTime || !datetime.endTime) {
    return null;
  }

  const localTimezone = park?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const inputTimezone = datetime.timeReference === 'utc' ? 'UTC' : localTimezone;

  const startUtc = toUtcTimestamp(datetime.date, datetime.startTime, inputTimezone);
  const endSourceDate =
    timeToMinutes(datetime.endTime) <= timeToMinutes(datetime.startTime)
      ? addDays(datetime.date, 1)
      : datetime.date;
  const endUtc = toUtcTimestamp(endSourceDate, datetime.endTime, inputTimezone);

  if (startUtc === null || endUtc === null) {
    return null;
  }

  return {
    localLabel: getLocalSummaryLabel(park),
    localTimezoneInfo: formatTimezoneInfo(park?.timezone),
    localDate: formatLongDateInZone(startUtc, localTimezone),
    localTimeRange: `${formatTimeInZone(startUtc, localTimezone)} - ${formatTimeInZone(endUtc, localTimezone)}`,
    utcDate: formatLongDateInZone(startUtc, 'UTC'),
    utcTimeRange: `${formatTimeInZone(startUtc, 'UTC')} - ${formatTimeInZone(endUtc, 'UTC')}`,
  };
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
  const datetimeSummary = showDatetime ? buildDateTimeSummary(datetime, park) : null;

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
            <span className="font-medium">Date & Time:</span>
            {datetimeSummary ? (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {datetimeSummary.localLabel}{datetimeSummary.localTimezoneInfo}
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {datetimeSummary.localDate}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {datetimeSummary.localTimeRange}
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    UTC
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {datetimeSummary.utcDate}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {datetimeSummary.utcTimeRange}
                  </div>
                </div>
              </div>
            ) : (
              <span> Not set</span>
            )}
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
