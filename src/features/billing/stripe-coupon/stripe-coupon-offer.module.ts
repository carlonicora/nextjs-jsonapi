import { ModuleFactory } from "../../../permissions";
import { StripeCouponOffer } from "./data/stripe-coupon-offer";

export const StripeCouponOfferModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-coupon-offers",
    pageUrl: "/pricing",
    model: StripeCouponOffer,
    moduleId: "6859d6cc-b94c-4cf7-8a02-b71ad59d75d2",
  });
