import { ModuleFactory } from "../../../permissions";
import { StripePromotionCode } from "./data/stripe-promotion-code";

export const StripePromotionCodeModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-promotion-codes",
    pageUrl: "/stripe-promotion-codes",
    model: StripePromotionCode,
    moduleId: "b8e4f6a2-9d0c-5b3f-c7e8-4g2d9f0a5c6e",
  });
