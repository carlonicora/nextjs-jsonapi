"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../../shadcnui";
import { StripeSubscriptionInterface } from "../../data";
import { useSubscriptionWizard } from "../../hooks/useSubscriptionWizard";
import { WizardProgressIndicator } from "./WizardProgressIndicator";
import { WizardStepPlanSelection } from "./WizardStepPlanSelection";
import { WizardStepReview } from "./WizardStepReview";
import { WizardStepPaymentMethod } from "./WizardStepPaymentMethod";

export type SubscriptionWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  hasActiveRecurringSubscription: boolean;
  subscription?: StripeSubscriptionInterface;
};

export function SubscriptionWizard({
  open,
  onOpenChange,
  onSuccess,
  hasActiveRecurringSubscription,
  subscription,
}: SubscriptionWizardProps) {
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  const { state, actions } = useSubscriptionWizard({
    subscription,
    onSuccess,
    onClose: handleClose,
  });

  // Track if we've already checked payment method for this open state
  const hasCheckedRef = useRef(false);

  // Check payment method on mount
  useEffect(() => {
    if (open && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      actions.checkPaymentMethod();
    }
    if (!open) {
      hasCheckedRef.current = false;
    }
  }, [open, actions.checkPaymentMethod]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      actions.reset();
    }
  }, [open, actions.reset]);

  const dialogTitle = subscription ? "Change Subscription Plan" : "Subscribe to a Plan";
  const dialogDescription = subscription
    ? "Select a new plan for your subscription"
    : "Choose a subscription plan to get started";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <WizardProgressIndicator currentStep={state.step} />

        {state.step === "plan-selection" && (
          <WizardStepPlanSelection
            selectedPrice={state.selectedPrice}
            selectedInterval={state.selectedInterval}
            currentPriceId={subscription?.price?.id}
            hideRecurringPrices={hasActiveRecurringSubscription && !subscription}
            onSelectPrice={actions.selectPrice}
            onIntervalChange={actions.setInterval}
            onNext={actions.goToReview}
            isProcessing={state.isProcessing}
          />
        )}

        {state.step === "review" && (
          <WizardStepReview
            selectedPrice={state.selectedPrice}
            subscription={subscription}
            prorationPreview={state.prorationPreview}
            hasPaymentMethod={state.hasPaymentMethod}
            error={state.error}
            isProcessing={state.isProcessing}
            onBack={() => actions.goToStep("plan-selection")}
            onAddPaymentMethod={() => actions.goToStep("payment-method")}
            onConfirm={actions.confirmSubscription}
          />
        )}

        {state.step === "payment-method" && (
          <WizardStepPaymentMethod
            onBack={() => actions.goToStep("review")}
            onSuccess={actions.handlePaymentMethodSuccess}
            isProcessing={state.isProcessing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
