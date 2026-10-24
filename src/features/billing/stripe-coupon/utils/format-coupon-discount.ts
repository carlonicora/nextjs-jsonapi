import { formatCurrency } from "../../components/utils/currency";
import { BillingFormatOptions, BillingTranslator } from "../../components/utils/format-options";
import { StripeCouponDiscountType, StripeCouponDurationType } from "../data/stripe-coupon.interface";

export type CouponDiscountShape = {
  discountType: StripeCouponDiscountType;
  percentOff?: number;
  amountOff?: number; // minor units
  currency?: string;
  duration: StripeCouponDurationType;
  durationInMonths?: number;
};

/** "20% off forever", "€5.00 off for 3 months", "€5.00 off once". */
export function formatCouponDiscount(
  coupon: CouponDiscountShape,
  t: BillingTranslator,
  fmt: BillingFormatOptions = {},
): string {
  const amount =
    coupon.discountType === "percent_off"
      ? t("billing.admin.coupons.discount.percent", { value: String(coupon.percentOff ?? 0) })
      : t("billing.admin.coupons.discount.amount", {
          amount: formatCurrency(coupon.amountOff, coupon.currency ?? "eur", fmt),
        });

  // Literal keys (no template) so the message validator sees every one in use.
  const duration =
    coupon.duration === "repeating"
      ? t("billing.admin.coupons.discount.repeating", { months: String(coupon.durationInMonths ?? 0) })
      : coupon.duration === "once"
        ? t("billing.admin.coupons.discount.once")
        : t("billing.admin.coupons.discount.forever");

  return `${amount} ${duration}`;
}
