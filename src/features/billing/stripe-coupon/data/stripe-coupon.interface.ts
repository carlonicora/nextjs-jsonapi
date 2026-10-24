import { ApiDataInterface } from "../../../../core";
import { StripeCouponCodeInput, StripeCouponCodeInterface } from "./stripe-coupon-code.interface";

// ============================================================================
// Stripe Coupon Interfaces
// ============================================================================

export type StripeCouponDiscountType = "percent_off" | "amount_off";
export type StripeCouponDurationType = "once" | "repeating" | "forever";

export interface StripeCouponInterface extends ApiDataInterface {
  get stripeCouponId(): string;
  get name(): string;
  get discountType(): StripeCouponDiscountType;
  get percentOff(): number | undefined;
  get amountOff(): number | undefined; // minor units (cents)
  get currency(): string | undefined;
  get duration(): StripeCouponDurationType;
  get durationInMonths(): number | undefined;
  get stripeProductIds(): string[]; // empty = every product
  get redeemBy(): Date | undefined;
  get maxRedemptions(): number | undefined;
  get timesRedeemed(): number;
  get valid(): boolean;
  get codes(): StripeCouponCodeInterface[];
}

// ============================================================================
// Stripe Coupon Input DTOs
// ============================================================================

/** The discount of a new coupon: a percentage, or a fixed amount in one currency. */
export type StripeCouponDiscountInput =
  | { discountType: "percent_off"; percentOff: number }
  | { discountType: "amount_off"; amountOff: number; currency: string }; // amountOff in minor units

/** How long a new coupon's discount lasts: months only when it repeats. */
export type StripeCouponDurationInput =
  { duration: "once" } | { duration: "forever" } | { duration: "repeating"; durationInMonths: number };

export type StripeCouponInput = {
  id: string;
  name: string;
  stripeCouponId?: string;
  productIds?: string[]; // our StripeProduct ids
  redeemBy?: Date;
  maxRedemptions?: number;
  firstCode: Omit<StripeCouponCodeInput, "id" | "couponId">;
} & StripeCouponDiscountInput &
  StripeCouponDurationInput;

export type StripeCouponRenameInput = {
  id: string;
  name: string;
};
