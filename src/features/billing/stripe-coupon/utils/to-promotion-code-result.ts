import { PromotionCodeValidationResult } from "../../stripe-promotion-code/data/stripe-promotion-code.interface";
import { StripeCouponCodeInterface } from "../data/stripe-coupon-code.interface";

/**
 * The automatic code as the wizard's promotion-code state, exactly as if the
 * GM had typed and validated it.
 */
export function toPromotionCodeResult(code: StripeCouponCodeInterface): PromotionCodeValidationResult {
  const coupon = code.coupon;
  const discountType = coupon?.discountType;

  return {
    valid: true,
    automatic: true,
    promotionCodeId: code.stripePromotionCodeId,
    code: code.code,
    discountType,
    discountValue: discountType === "amount_off" ? coupon?.amountOff : coupon?.percentOff,
    currency: discountType === "amount_off" ? coupon?.currency : undefined,
    duration: coupon?.duration,
    durationInMonths: coupon?.durationInMonths,
  };
}
