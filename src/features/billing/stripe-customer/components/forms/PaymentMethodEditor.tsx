"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../shadcnui";
import { PaymentMethodForm } from "./PaymentMethodForm";

type PaymentMethodEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function PaymentMethodEditor({ open, onOpenChange, onSuccess }: PaymentMethodEditorProps) {
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
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a new payment method to your account. Your card information is securely processed by Stripe.
          </DialogDescription>
        </DialogHeader>
        {open && <PaymentMethodForm onSuccess={handleSuccess} onCancel={handleCancel} />}
      </DialogContent>
    </Dialog>
  );
}
