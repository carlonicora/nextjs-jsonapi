import { PromotionCodeValidationResult } from "../../stripe-promotion-code/data/stripe-promotion-code.interface";
import { StripeSubscriptionInterface } from "../../stripe-subscription/data/stripe-subscription.interface";

/** A discount as the billing screens apply it: a percentage, or an amount in minor units. */
export type BillingDiscount = {
  discountType: "percent_off" | "amount_off";
  discountValue: number;
  currency?: string;
};

/** The discount a valid promotion code (typed or automatic) gives, or null. */
export function promotionCodeDiscount(code: PromotionCodeValidationResult | null | undefined): BillingDiscount | null {
  if (!code?.valid || !code.discountType || !code.discountValue) return null;
  return { discountType: code.discountType, discountValue: code.discountValue, currency: code.currency };
}

/** The discount a subscription already carries in Stripe, or null. */
export function subscriptionDiscount(
  subscription: StripeSubscriptionInterface | null | undefined,
): BillingDiscount | null {
  const discount = subscription?.discount;
  if (!discount) return null;
  if (discount.percentOff) return { discountType: "percent_off", discountValue: discount.percentOff };
  if (discount.amountOff) {
    return { discountType: "amount_off", discountValue: discount.amountOff, currency: discount.currency };
  }
  return null;
}

/**
 * The amount after the discount, in the same minor units; null when there is no
 * discount or nothing to discount. An amount discount never goes below zero.
 */
export function applyDiscount(amount: number | undefined, discount: BillingDiscount | null): number | null {
  if (!discount || !amount) return null;
  if (discount.discountType === "percent_off") return amount * (1 - discount.discountValue / 100);
  return Math.max(0, amount - discount.discountValue);
}
