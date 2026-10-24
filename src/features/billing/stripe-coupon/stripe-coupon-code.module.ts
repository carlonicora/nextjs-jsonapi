import { ModuleFactory } from "../../../permissions";
import { StripeCouponCode } from "./data/stripe-coupon-code";

/** The code endpoint's segment that returns the automatic code for a price. */
export const STRIPE_COUPON_CODE_AUTOMATIC_SEGMENT = "automatic";

export const StripeCouponCodeModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-coupon-codes",
    // Codes are listed on the products page (Codes tab), same value as
    // StripeProductModule. A code has no page of its own.
    pageUrl: "/administration/products",
    model: StripeCouponCode,
    moduleId: "85feb4c7-ff22-416a-b856-8dafcf28ff26",
  });
