"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, Button } from "../../../../../shadcnui";
import { formatCurrency } from "../../../components/utils/currency";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { ProrationPreviewInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { PromotionCodeValidationResult } from "../../../stripe-promotion-code";
import { PromoCodeInput } from "../../../stripe-promotion-code/components/PromoCodeInput";
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
  // Promotion code props
  promotionCode: PromotionCodeValidationResult | null;
  isValidatingPromoCode: boolean;
  promoCodeError: string | null;
  onApplyPromoCode: (code: string) => void;
  onRemovePromoCode: () => void;
  // Trial upgrade flag
  isTrialUpgrade: boolean;
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
  promotionCode,
  isValidatingPromoCode,
  promoCodeError,
  onApplyPromoCode,
  onRemovePromoCode,
  isTrialUpgrade,
}: WizardStepReviewProps) {
  if (!selectedPrice) {
    return (
      <div className="text-center py-8 text-muted-foreground">No plan selected. Please go back and select a plan.</div>
    );
  }

  const isChangingPlan = subscription && subscription.price?.id !== selectedPrice.id;

  const formatInterval = (price: StripePriceInterface) => {
    if (price.priceType === "one_time") return "one-time";
    const interval = price.recurring?.interval || "month";
    return interval === "year" ? "yearly" : "monthly";
  };

  // Calculate discounted price if promotion code is applied
  const calculateDiscountedPrice = (): number | null => {
    if (!promotionCode?.valid || !selectedPrice.unitAmount) return null;

    const originalPrice = selectedPrice.unitAmount;

    if (promotionCode.discountType === "percent_off" && promotionCode.discountValue) {
      return originalPrice * (1 - promotionCode.discountValue / 100);
    }

    if (promotionCode.discountType === "amount_off" && promotionCode.discountValue) {
      // amount_off is in cents, same as unitAmount
      return Math.max(0, originalPrice - promotionCode.discountValue);
    }

    return null;
  };

  const discountedPrice = calculateDiscountedPrice();

  // Calculate discounted immediate charge for proration preview
  const calculateDiscountedImmediateCharge = (): number | null => {
    if (!promotionCode?.valid || !prorationPreview?.immediateCharge) return null;

    const originalCharge = prorationPreview.immediateCharge;

    if (promotionCode.discountType === "percent_off" && promotionCode.discountValue) {
      return originalCharge * (1 - promotionCode.discountValue / 100);
    }

    if (promotionCode.discountType === "amount_off" && promotionCode.discountValue) {
      return Math.max(0, originalCharge - promotionCode.discountValue);
    }

    return null;
  };

  const discountedImmediateCharge = calculateDiscountedImmediateCharge();

  // Format the discount description
  const getDiscountDescription = (): string | null => {
    if (!promotionCode?.valid) return null;

    if (promotionCode.discountType === "percent_off" && promotionCode.discountValue) {
      return `${promotionCode.discountValue}% off`;
    }

    if (promotionCode.discountType === "amount_off" && promotionCode.discountValue) {
      return `${formatCurrency(promotionCode.discountValue, promotionCode.currency || selectedPrice.currency)} off`;
    }

    return null;
  };

  const discountDescription = getDiscountDescription();

  return (
    <div className="space-y-6">
      {/* Selected Plan Summary */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-lg">Selected Plan</h3>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{selectedPrice.product?.name}</p>
            {selectedPrice.nickname && <p className="text-sm text-muted-foreground">{selectedPrice.nickname}</p>}
          </div>
          <div className="text-right">
            {discountedPrice !== null ? (
              <>
                <p className="text-sm text-muted-foreground line-through">
                  {formatCurrency(selectedPrice.unitAmount || 0, selectedPrice.currency)}
                </p>
                <p className="font-semibold text-lg text-green-600">
                  {formatCurrency(discountedPrice, selectedPrice.currency)}
                </p>
                {discountDescription && (
                  <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {discountDescription}
                  </span>
                )}
              </>
            ) : (
              <p className="font-semibold text-lg">
                {formatCurrency(selectedPrice.unitAmount || 0, selectedPrice.currency)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">{formatInterval(selectedPrice)}</p>
          </div>
        </div>
      </div>

      {/* Proration Preview (for plan changes) */}
      {isChangingPlan && prorationPreview && (
        <div
          className={`${isTrialUpgrade ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"} border rounded-lg p-4 space-y-2`}
        >
          <h4 className={`font-medium ${isTrialUpgrade ? "text-amber-800" : "text-blue-800"}`}>
            {isTrialUpgrade ? "Trial Upgrade" : "Proration Summary"}
          </h4>
          <p className={`text-sm ${isTrialUpgrade ? "text-amber-700" : "text-blue-700"}`}>
            {isTrialUpgrade
              ? "Your trial will end immediately and you will be charged the full price."
              : "Your next charge will be adjusted to account for the plan change."}
          </p>
          <div className="flex justify-between text-sm">
            <span className={`${isTrialUpgrade ? "text-amber-600" : "text-blue-600"}`}>
              {isTrialUpgrade ? "Amount to charge now:" : "Amount due now:"}
            </span>
            <span className={`font-medium ${isTrialUpgrade ? "text-amber-800" : "text-blue-800"}`}>
              {discountedImmediateCharge !== null ? (
                <>
                  <span className="line-through text-muted-foreground mr-2">
                    {formatCurrency(prorationPreview.immediateCharge, prorationPreview.currency)}
                  </span>
                  <span className="text-green-600">
                    {formatCurrency(discountedImmediateCharge, prorationPreview.currency)}
                  </span>
                </>
              ) : (
                formatCurrency(prorationPreview.immediateCharge, prorationPreview.currency)
              )}
            </span>
          </div>
        </div>
      )}

      {/* Promotion Code */}
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium">Promotion Code</h4>
        <PromoCodeInput
          appliedCode={promotionCode}
          isValidating={isValidatingPromoCode}
          error={promoCodeError}
          onApply={onApplyPromoCode}
          onRemove={onRemovePromoCode}
          disabled={isProcessing}
        />
      </div>

      {/* Payment Method Status */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">Payment Method</h4>
            <p className="text-sm text-muted-foreground">
              {hasPaymentMethod ? "A payment method is on file" : "No payment method on file"}
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
        <Button onClick={hasPaymentMethod ? onConfirm : onAddPaymentMethod} disabled={isProcessing}>
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
