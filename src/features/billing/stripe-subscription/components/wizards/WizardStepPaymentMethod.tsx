"use client";

import { PaymentMethodForm } from "../../../stripe-customer/components/forms/PaymentMethodForm";

type WizardStepPaymentMethodProps = {
  onBack: () => void;
  onSuccess: () => void;
  isProcessing: boolean;
};

export function WizardStepPaymentMethod({
  onBack,
  onSuccess,
  isProcessing,
}: WizardStepPaymentMethodProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-semibold text-lg">Add Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          Enter your card details to complete your subscription
        </p>
      </div>

      <PaymentMethodForm
        onSuccess={onSuccess}
        onCancel={onBack}
        isLoading={isProcessing}
      />
    </div>
  );
}
