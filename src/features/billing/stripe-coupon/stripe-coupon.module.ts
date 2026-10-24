import { TicketPercentIcon } from "lucide-react";
import { ModuleFactory } from "../../../permissions";
import { StripeCoupon } from "./data/stripe-coupon";

/** The coupon endpoint's non-resource segment that re-reads its counts from Stripe. */
export const STRIPE_COUPON_REFRESH_SEGMENT = "refresh";

/**
 * Route of a coupon's own page (`/administration/coupons/<id>`). It is not the
 * module's pageUrl: there is no coupons list route, the list is the Codes tab of
 * the products page. Links to one coupon build on this instead.
 */
export const STRIPE_COUPON_DETAIL_PAGE_URL = "/administration/coupons";

export const StripeCouponModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-coupons",
    // The coupons list lives on the products page (Codes tab), so the module
    // points there, same value as StripeProductModule. Links to a single coupon
    // use STRIPE_COUPON_DETAIL_PAGE_URL.
    pageUrl: "/administration/products",
    model: StripeCoupon,
    moduleId: "50bdb0d2-539c-4358-b609-d6beab248bdb",
    icon: TicketPercentIcon,
  });
