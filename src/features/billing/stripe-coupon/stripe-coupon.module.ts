import { TicketPercentIcon } from "lucide-react";
import { ModuleFactory } from "../../../permissions";
import { StripeCoupon } from "./data/stripe-coupon";

/** The coupon endpoint's non-resource segment that re-reads its counts from Stripe. */
export const STRIPE_COUPON_REFRESH_SEGMENT = "refresh";

export const StripeCouponModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-coupons",
    // The administration route this entity is served at. `name` above stays the
    // API endpoint; this drives generateUrl / rewriteUrl / EditorSheet
    // navigation, so it must match the real Next.js route.
    pageUrl: "/administration/coupons",
    model: StripeCoupon,
    moduleId: "50bdb0d2-539c-4358-b609-d6beab248bdb",
    icon: TicketPercentIcon,
  });
