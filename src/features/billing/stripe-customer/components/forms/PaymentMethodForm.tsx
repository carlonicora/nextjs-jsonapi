"use client";

import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, Button, Checkbox, Label } from "../../../../../shadcnui";
import { StripeCustomerService } from "../../data";

type PaymentMethodFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function PaymentMethodForm({ onSuccess, onCancel, isLoading = false }: PaymentMethodFormProps) {
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
      setLoading(true);
      try {
        const intent = await StripeCustomerService.createSetupIntent();
        setSetupIntent(intent);
      } catch (err) {
        console.error("[PaymentMethodForm] Failed to create setup intent:", err);
        setError("Failed to initialize payment form. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSetupIntent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !setupIntent) {
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
      const { error: stripeError, setupIntent: confirmedSetupIntent } = await stripe.confirmCardSetup(
        setupIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        },
      );

      if (stripeError) {
        console.error("[PaymentMethodForm] Stripe error:", stripeError);
        setError(stripeError.message || "Failed to add payment method. Please check your card details.");
        setIsSubmitting(false);
        return;
      }

      // Set as default if checkbox is checked
      if (setAsDefault && confirmedSetupIntent?.payment_method) {
        await StripeCustomerService.setDefaultPaymentMethod({
          paymentMethodId:
            typeof confirmedSetupIntent.payment_method === "string"
              ? confirmedSetupIntent.payment_method
              : confirmedSetupIntent.payment_method.id,
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error("[PaymentMethodForm] Error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading payment form...</p>
      </div>
    );
  }

  if (!setupIntent && error) {
    return (
      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
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
        <Checkbox id="setAsDefault" checked={setAsDefault} onCheckedChange={(checked) => setSetAsDefault(!!checked)} />
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isSubmitting || isLoading}>
          {isSubmitting ? "Processing..." : "Add Card"}
        </Button>
      </div>
    </form>
  );
}
