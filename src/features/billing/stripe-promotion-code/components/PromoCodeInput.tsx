"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button, Input } from "../../../../shadcnui";
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
  const [code, setCode] = useState("");

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
      return `${result.discountValue}% off`;
    }
    // amount_off is in cents, convert to dollars
    const amount = (result.discountValue || 0) / 100;
    const currency = result.currency?.toUpperCase() || "USD";
    return `${currency} ${amount.toFixed(2)} off`;
  };

  // Format duration for display
  const formatDuration = (result: PromotionCodeValidationResult): string => {
    switch (result.duration) {
      case "forever":
        return "Applied to all payments";
      case "once":
        return "Applied to first payment only";
      case "repeating":
        return `Applied for ${result.durationInMonths} months`;
      default:
        return "";
    }
  };

  // Show applied code state
  if (appliedCode?.valid) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">{appliedCode.code}</span>
            <span className="text-sm text-green-600">{formatDiscount(appliedCode)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="text-green-700 hover:text-green-900 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-green-600">{formatDuration(appliedCode)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={disabled || isValidating}
          className="flex-1"
        />
        <Button variant="outline" onClick={handleApply} disabled={disabled || isValidating || !code.trim()}>
          {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
