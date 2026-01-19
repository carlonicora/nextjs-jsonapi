/**
 * Promotion code validation result from the backend
 */
export interface PromotionCodeValidationResult {
  valid: boolean;
  promotionCodeId?: string;
  code: string;
  discountType?: "percent_off" | "amount_off";
  discountValue?: number;
  currency?: string;
  duration?: "forever" | "once" | "repeating";
  durationInMonths?: number;
  errorMessage?: string;
}
