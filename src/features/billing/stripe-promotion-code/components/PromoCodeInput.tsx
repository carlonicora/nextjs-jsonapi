"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button, Input } from "../../../../shadcnui";
import { useI18nLocale } from "../../../../i18n";
import { formatFixed } from "../../components/utils";
import { PromotionCodeValidationResult } from "../data/stripe-promotion-code.interface";

type PromoCodeInputProps = {
  appliedCode: PromotionCodeValidationResult | null;
  isValidating: boolean;
  error: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function PromoCodeInput({
  appliedCode,
  isValidating,
  error,
  onApply,
  onRemove,
  disabled = false,
}: PromoCodeInputProps) {
  const t = useTranslations();
  const locale = useI18nLocale();
  const [code, setCode] = useState("");

  // Clear the typed text whenever a code becomes applied (typed or automatic):
  // the box then reads empty after the applied code is removed, instead of
  // still holding the removed code. Adjusting state during render on a prop
  // change (React's "storing information from previous renders" pattern) —
  // a failed validation keeps the text so the user can fix a typo.
  const appliedKey = appliedCode?.valid
    ? `${appliedCode.automatic ? "auto" : "typed"}:${appliedCode.code ?? ""}`
    : null;
  const [previousAppliedKey, setPreviousAppliedKey] = useState(appliedKey);
  if (appliedKey !== previousAppliedKey) {
    setPreviousAppliedKey(appliedKey);
    if (appliedKey !== null) setCode("");
  }

  const handleRemove = () => {
    setCode("");
    onRemove();
  };

  const handleApply = () => {
    if (code.trim()) {
      onApply(code.trim().toUpperCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  // Format discount for display
  const formatDiscount = (result: PromotionCodeValidationResult): string => {
    if (result.discountType === "percent_off") {
      return t("billing.ui.wizard.review.percent_off", { value: String(result.discountValue) });
    }
    // amount_off is in cents, convert to dollars
    const amount = (result.discountValue || 0) / 100;
    const currency = result.currency?.toUpperCase() || "USD";
    return t("billing.ui.wizard.review.amount_off", { amount: `${currency} ${formatFixed(amount, locale, 2)}` });
  };

  // Format duration for display
  const formatDuration = (result: PromotionCodeValidationResult): string => {
    switch (result.duration) {
      case "forever":
        return t("billing.ui.promo_code.duration_forever");
      case "once":
        return t("billing.ui.promo_code.duration_once");
      case "repeating":
        return t("billing.ui.promo_code.duration_repeating", { months: String(result.durationInMonths) });
      default:
        return "";
    }
  };

  const codeInput = (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={t("billing.ui.promo_code.placeholder")}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={disabled || isValidating}
          className="flex-1"
        />
        <Button variant="outline" onClick={handleApply} disabled={disabled || isValidating || !code.trim()}>
          {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("billing.ui.promo_code.apply")}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs/relaxed">{error}</p>}
    </div>
  );

  // Show the automatic code as applied, with the option to type a different one
  if (appliedCode?.valid && appliedCode.automatic) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="bg-success/15 border-success/30 flex items-center gap-2 rounded-lg border p-3">
            <Check className="text-success h-4 w-4" />
            <span className="text-success font-medium">{t("billing.ui.promo_code.automatic_label")}</span>
            <span className="text-success text-sm">{formatDiscount(appliedCode)}</span>
          </div>
          <p className="text-success text-sm">{formatDuration(appliedCode)}</p>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">{t("billing.ui.promo_code.use_different")}</p>
          {codeInput}
        </div>
      </div>
    );
  }

  // Show applied code state
  if (appliedCode?.valid) {
    return (
      <div className="space-y-2">
        <div className="bg-success/15 border-success/30 flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Check className="text-success h-4 w-4" />
            <span className="text-success font-medium">{appliedCode.code}</span>
            <span className="text-success text-sm">{formatDiscount(appliedCode)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="text-success hover:bg-success/25 hover:text-success"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-success text-sm">{formatDuration(appliedCode)}</p>
      </div>
    );
  }

  return codeInput;
}
