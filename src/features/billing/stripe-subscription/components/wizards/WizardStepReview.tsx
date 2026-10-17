"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, Badge, Button } from "../../../../../shadcnui";
import { SectionHeader } from "../../../../../components/typography";
import { formatCurrency, useBillingFormatOptions } from "../../../components/utils";
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
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  if (!selectedPrice) {
    return <div className="text-center py-8 text-muted-foreground">{t("billing.ui.wizard.review.no_plan")}</div>;
  }

  const isChangingPlan = subscription && subscription.price?.id !== selectedPrice.id;

  const formatInterval = (price: StripePriceInterface) => {
    if (price.priceType === "one_time") return t("billing.ui.wizard.review.interval_one_time");
    const interval = price.recurring?.interval || "month";
    return interval === "year"
      ? t("billing.ui.wizard.review.interval_yearly")
      : t("billing.ui.wizard.review.interval_monthly");
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
      return t("billing.ui.wizard.review.percent_off", { value: promotionCode.discountValue });
    }

    if (promotionCode.discountType === "amount_off" && promotionCode.discountValue) {
      return t("billing.ui.wizard.review.amount_off", {
        amount: formatCurrency(promotionCode.discountValue, promotionCode.currency || selectedPrice.currency, fmt),
      });
    }

    return null;
  };

  const discountDescription = getDiscountDescription();

  return (
    <div className="space-y-6">
      {/* Selected Plan Summary */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <SectionHeader>{t("billing.ui.wizard.review.selected_plan")}</SectionHeader>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{selectedPrice.product?.name}</p>
            {selectedPrice.nickname && <p className="text-sm text-muted-foreground">{selectedPrice.nickname}</p>}
          </div>
          <div className="text-end">
            {discountedPrice !== null ? (
              <>
                <p className="text-sm text-muted-foreground line-through">
                  {formatCurrency(selectedPrice.unitAmount || 0, selectedPrice.currency, fmt)}
                </p>
                <p className="text-success text-lg font-semibold">
                  {formatCurrency(discountedPrice, selectedPrice.currency, fmt)}
                </p>
                {discountDescription && <Badge variant="softGreen">{discountDescription}</Badge>}
              </>
            ) : (
              <p className="font-semibold text-lg">
                {formatCurrency(selectedPrice.unitAmount || 0, selectedPrice.currency, fmt)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">{formatInterval(selectedPrice)}</p>
          </div>
        </div>
      </div>

      {/* Proration Preview (for plan changes) */}
      {isChangingPlan && prorationPreview && (
        <div
          className={`${isTrialUpgrade ? "bg-warning/15 border-warning/30" : "bg-primary/10 border-primary/30"} space-y-2 rounded-lg border p-4`}
        >
          <h4 className={`font-medium ${isTrialUpgrade ? "text-warning" : "text-primary"}`}>
            {isTrialUpgrade
              ? t("billing.ui.wizard.review.trial_upgrade")
              : t("billing.ui.wizard.review.proration_summary")}
          </h4>
          <p className={`text-sm ${isTrialUpgrade ? "text-warning" : "text-foreground"}`}>
            {isTrialUpgrade
              ? t("billing.ui.wizard.review.trial_upgrade_description")
              : t("billing.ui.wizard.review.proration_description")}
          </p>
          <div className="flex justify-between text-sm">
            <span className={`${isTrialUpgrade ? "text-warning" : "text-muted-foreground"}`}>
              {isTrialUpgrade ? t("billing.ui.wizard.review.charge_now") : t("billing.ui.wizard.review.due_now")}
            </span>
            <span className={`font-medium ${isTrialUpgrade ? "text-warning" : "text-foreground"}`}>
              {discountedImmediateCharge !== null ? (
                <>
                  <span className="line-through text-muted-foreground me-2">
                    {formatCurrency(prorationPreview.immediateCharge, prorationPreview.currency, fmt)}
                  </span>
                  <span className="text-success">
                    {formatCurrency(discountedImmediateCharge, prorationPreview.currency, fmt)}
                  </span>
                </>
              ) : (
                formatCurrency(prorationPreview.immediateCharge, prorationPreview.currency, fmt)
              )}
            </span>
          </div>
        </div>
      )}

      {/* Promotion Code */}
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium">{t("billing.ui.wizard.review.promotion_code")}</h4>
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
            <h4 className="font-medium">{t("billing.ui.payment_method.title")}</h4>
            <p className="text-sm text-muted-foreground">
              {hasPaymentMethod
                ? t("billing.ui.wizard.review.payment_on_file")
                : t("billing.ui.wizard.review.no_payment_on_file")}
            </p>
          </div>
          {!hasPaymentMethod && (
            <Button variant="outline" onClick={onAddPaymentMethod}>
              {t("billing.ui.payment_methods.add")}
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
          {t("billing.ui.wizard.back")}
        </Button>
        <Button onClick={hasPaymentMethod ? onConfirm : onAddPaymentMethod} disabled={isProcessing}>
          {isProcessing
            ? t("billing.ui.wizard.review.processing")
            : hasPaymentMethod
              ? isChangingPlan
                ? t("billing.ui.wizard.review.confirm_change")
                : t("billing.ui.wizard.review.subscribe_now")
              : t("billing.ui.payment_methods.add")}
        </Button>
      </div>
    </div>
  );
}
