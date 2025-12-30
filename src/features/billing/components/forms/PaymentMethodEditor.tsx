"use client";

import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
} from "../../../../shadcnui";
import { BillingService } from "../../data/billing.service";
import { StripeBillingCustomerService } from "../../stripe-billing-customer";

type PaymentMethodEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function PaymentMethodEditor({ open, onOpenChange, onSuccess }: PaymentMethodEditorProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [setupIntent, setSetupIntent] = useState<{ clientSecret: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [setAsDefault, setSetAsDefault] = useState<boolean>(true);

  // Fetch setup intent on component mount
  useEffect(() => {
    const fetchSetupIntent = async () => {
      console.log("[PaymentMethodEditor] Fetching setup intent...");
      setLoading(true);
      try {
        const intent = await StripeBillingCustomerService.createSetupIntent();
        console.log("[PaymentMethodEditor] Setup intent created:", intent);
        setSetupIntent(intent);
      } catch (err) {
        console.error("[PaymentMethodEditor] Failed to create setup intent:", err);
        setError("Failed to initialize payment form. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchSetupIntent();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[PaymentMethodEditor] Submitting payment method...");

    if (!stripe || !elements || !setupIntent) {
      console.error("[PaymentMethodEditor] Stripe not ready");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Confirm card setup with Stripe
      console.log("[PaymentMethodEditor] Confirming card setup...");
      const { error: stripeError, setupIntent: confirmedSetupIntent } = await stripe.confirmCardSetup(
        setupIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        },
      );

      if (stripeError) {
        console.error("[PaymentMethodEditor] Stripe error:", stripeError);
        setError(stripeError.message || "Failed to add payment method. Please check your card details.");
        setIsSubmitting(false);
        return;
      }

      console.log("[PaymentMethodEditor] Card setup confirmed:", confirmedSetupIntent);

      // Set as default if checkbox is checked
      if (setAsDefault && confirmedSetupIntent?.payment_method) {
        console.log("[PaymentMethodEditor] Setting as default payment method...");
        await BillingService.setDefaultPaymentMethod({
          paymentMethodId:
            typeof confirmedSetupIntent.payment_method === "string"
              ? confirmedSetupIntent.payment_method
              : confirmedSetupIntent.payment_method.id,
        });
      }

      console.log("[PaymentMethodEditor] Payment method added successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("[PaymentMethodEditor] Error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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

        {loading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading payment form...</p>
          </div>
        )}

        {!loading && setupIntent && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
            {/* Card Element */}
            <div className="rounded-md border border-gray-300 p-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                    invalid: {
                      color: "#9e2146",
                    },
                  },
                }}
              />
            </div>

            {/* Set as Default Checkbox */}
            <div className="flex items-center gap-x-2">
              <Checkbox
                id="setAsDefault"
                checked={setAsDefault}
                onCheckedChange={(checked) => setSetAsDefault(!!checked)}
              />
              <Label htmlFor="setAsDefault" className="text-sm font-normal">
                Set as default payment method
              </Label>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!stripe || isSubmitting}>
                {isSubmitting ? "Processing..." : "Add Card"}
              </Button>
            </div>
          </form>
        )}

        {/* Error State */}
        {!loading && !setupIntent && error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
