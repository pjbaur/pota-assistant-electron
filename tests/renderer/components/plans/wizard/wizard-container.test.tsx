import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WizardContainer } from '../../../../../src/renderer/components/plans/wizard/wizard-container';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('renderer/components/plans/wizard/wizard-container', () => {
  it('disables next when canProceed is false and hides back on first step', () => {
    render(
      <WizardContainer
        currentStep="park"
        completedSteps={[]}
        canProceed={false}
        onBack={vi.fn()}
        onNext={vi.fn()}
        onCancel={vi.fn()}
        onCreate={vi.fn()}
        onGoToStep={vi.fn()}
      >
        <div>Step body</div>
      </WizardContainer>
    );

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('allows navigating to a completed step indicator', () => {
    const onGoToStep = vi.fn();

    render(
      <WizardContainer
        currentStep="datetime"
        completedSteps={['park']}
        canProceed
        onBack={vi.fn()}
        onNext={vi.fn()}
        onCancel={vi.fn()}
        onCreate={vi.fn()}
        onGoToStep={onGoToStep}
      >
        <div>Step body</div>
      </WizardContainer>
    );

    const selectParkLabel = screen.getByText('Select Park');
    const stepButton = selectParkLabel.previousElementSibling;
    if (!(stepButton instanceof HTMLButtonElement)) {
      throw new Error('Expected step button element');
    }

    fireEvent.click(stepButton);
    expect(onGoToStep).toHaveBeenCalledWith('park');
  });

  it('handles cancel and create actions on review step', () => {
    const onCancel = vi.fn();
    const onCreate = vi.fn();

    render(
      <WizardContainer
        currentStep="review"
        completedSteps={['park', 'datetime', 'equipment', 'bands']}
        canProceed
        isEditing
        onBack={vi.fn()}
        onNext={vi.fn()}
        onCancel={onCancel}
        onCreate={onCreate}
        onGoToStep={vi.fn()}
      >
        <div>Review body</div>
      </WizardContainer>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/plans');

    fireEvent.click(screen.getByRole('button', { name: 'Update Plan' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
