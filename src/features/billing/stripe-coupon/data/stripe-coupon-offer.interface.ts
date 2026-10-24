import { ApiDataInterface } from "../../../../core";
import { StripeCouponDiscountType, StripeCouponDurationType } from "./stripe-coupon.interface";

// ============================================================================
// Stripe Coupon Offer Interface (public, synthetic: the automatic code's places left)
// ============================================================================

export interface StripeCouponOfferInterface extends ApiDataInterface {
  get discountType(): StripeCouponDiscountType;
  get percentOff(): number | undefined;
  get amountOff(): number | undefined; // minor units
  get currency(): string | undefined;
  get duration(): StripeCouponDurationType;
  get durationInMonths(): number | undefined;
  get placesLeft(): number;
  get placesTotal(): number;
}
