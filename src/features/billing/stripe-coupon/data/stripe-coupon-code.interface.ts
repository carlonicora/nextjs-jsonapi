import { ApiDataInterface } from "../../../../core";
import { StripeCouponInterface } from "./stripe-coupon.interface";

// ============================================================================
// Stripe Coupon Code Interfaces (a customer-facing promotion code of a coupon)
// ============================================================================

export interface StripeCouponCodeInterface extends ApiDataInterface {
  get stripePromotionCodeId(): string;
  get code(): string;
  get active(): boolean;
  get automatic(): boolean;
  get firstTimeTransaction(): boolean;
  get minimumAmount(): number | undefined; // minor units
  get minimumAmountCurrency(): string | undefined;
  get stripeCustomerId(): string | undefined;
  get expiresAt(): Date | undefined;
  get maxRedemptions(): number | undefined;
  get timesRedeemed(): number;
  get coupon(): StripeCouponInterface | undefined;
}

// ============================================================================
// Stripe Coupon Code Input DTOs
// ============================================================================

export type StripeCouponCodeInput = {
  id: string;
  couponId: string;
  code?: string;
  firstTimeTransaction?: boolean;
  minimumAmount?: number;
  minimumAmountCurrency?: string;
  stripeCustomerId?: string;
  expiresAt?: Date;
  maxRedemptions?: number;
  automatic?: boolean;
};

export type StripeCouponCodeFlagsInput = {
  id: string;
  active?: boolean;
  automatic?: boolean;
};
