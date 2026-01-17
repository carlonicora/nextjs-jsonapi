"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, Button } from "../../../../../shadcnui";
import { formatCurrency } from "../../../components/utils/currency";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { ProrationPreviewInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { StripeSubscriptionInterface } from "../../data";

type WizardStepReviewProps = {
  selectedPrice: StripePriceInterface | null;
  subscription?: StripeSubscriptionInterface;
  prorationPreview: ProrationPreviewInterface | null;
  hasPaymentMethod: boolean;
  error: string | null;
  isProcessing: boolean;
  onBack: () => void;
  onAddPaymentMethod: () => void;
  onConfirm: () => void;
};

export function WizardStepReview({
  selectedPrice,
  subscription,
  prorationPreview,
  hasPaymentMethod,
  error,
  isProcessing,
  onBack,
  onAddPaymentMethod,
  onConfirm,
}: WizardStepReviewProps) {
  if (!selectedPrice) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No plan selected. Please go back and select a plan.
      </div>
    );
  }

  const isChangingPlan = subscription && subscription.price?.id !== selectedPrice.id;

  const formatInterval = (price: StripePriceInterface) => {
    if (price.priceType === "one_time") return "one-time";
    const interval = price.recurring?.interval || "month";
    return interval === "year" ? "yearly" : "monthly";
  };

  return (
    <div className="space-y-6">
      {/* Selected Plan Summary */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-lg">Selected Plan</h3>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{selectedPrice.product?.name}</p>
            {selectedPrice.nickname && (
              <p className="text-sm text-muted-foreground">{selectedPrice.nickname}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg">
              {formatCurrency(selectedPrice.unitAmount || 0, selectedPrice.currency)}
            </p>
            <p className="text-sm text-muted-foreground">{formatInterval(selectedPrice)}</p>
          </div>
        </div>
      </div>

      {/* Proration Preview (for plan changes) */}
      {isChangingPlan && prorationPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-blue-800">Proration Summary</h4>
          <p className="text-sm text-blue-700">
            Your next charge will be adjusted to account for the plan change.
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-blue-600">Amount due now:</span>
            <span className="font-medium text-blue-800">
              {formatCurrency(prorationPreview.immediateCharge, prorationPreview.currency)}
            </span>
          </div>
        </div>
      )}

      {/* Payment Method Status */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">Payment Method</h4>
            <p className="text-sm text-muted-foreground">
              {hasPaymentMethod
                ? "A payment method is on file"
                : "No payment method on file"}
            </p>
          </div>
          {!hasPaymentMethod && (
            <Button variant="outline" onClick={onAddPaymentMethod}>
              Add Payment Method
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        <Button
          onClick={hasPaymentMethod ? onConfirm : onAddPaymentMethod}
          disabled={isProcessing}
        >
          {isProcessing
            ? "Processing..."
            : hasPaymentMethod
              ? isChangingPlan
                ? "Confirm Plan Change"
                : "Subscribe Now"
              : "Add Payment Method"}
        </Button>
      </div>
    </div>
  );
}
