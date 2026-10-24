"use client";

import { useTranslations } from "next-intl";
import { PaymentMethodForm } from "../../../stripe-customer/components/forms/PaymentMethodForm";
import { SectionHeader } from "../../../../../components/typography";

type WizardStepPaymentMethodProps = {
  onBack: () => void;
  onSuccess: () => void;
  isProcessing: boolean;
};

export function WizardStepPaymentMethod({ onBack, onSuccess, isProcessing }: WizardStepPaymentMethodProps) {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <SectionHeader>{t("billing.ui.payment_methods.add")}</SectionHeader>
        <p className="text-sm text-muted-foreground">{t("billing.ui.wizard.payment_description")}</p>
      </div>

      <PaymentMethodForm onSuccess={onSuccess} onCancel={onBack} isLoading={isProcessing} alwaysSetDefault />
    </div>
  );
}
