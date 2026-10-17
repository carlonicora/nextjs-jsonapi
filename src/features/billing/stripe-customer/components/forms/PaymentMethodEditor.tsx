"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../shadcnui";
import { PaymentMethodForm } from "./PaymentMethodForm";

type PaymentMethodEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function PaymentMethodEditor({ open, onOpenChange, onSuccess }: PaymentMethodEditorProps) {
  const t = useTranslations();
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("billing.ui.payment_methods.add")}</DialogTitle>
          <DialogDescription>{t("billing.ui.payment_methods.add_description")}</DialogDescription>
        </DialogHeader>
        {open && <PaymentMethodForm onSuccess={handleSuccess} onCancel={handleCancel} />}
      </DialogContent>
    </Dialog>
  );
}
