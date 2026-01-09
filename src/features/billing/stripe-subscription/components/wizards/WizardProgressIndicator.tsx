"use client";

import { Check } from "lucide-react";
import { WizardStep } from "../../hooks/useSubscriptionWizard";

type WizardProgressIndicatorProps = {
  currentStep: WizardStep;
};

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "plan-selection", label: "Select Plan" },
  { key: "review", label: "Review" },
  { key: "payment-method", label: "Payment" },
];

function getStepIndex(step: WizardStep): number {
  return STEPS.findIndex((s) => s.key === step);
}

export function WizardProgressIndicator({ currentStep }: WizardProgressIndicatorProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-center gap-x-2 py-4">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-x-2">
            {/* Step Indicator */}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
            </div>

            {/* Step Label */}
            <span
              className={`text-sm ${
                isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>

            {/* Connector */}
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 ${
                  index < currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
