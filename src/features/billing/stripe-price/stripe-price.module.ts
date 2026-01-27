import { ModuleFactory } from "../../../permissions";
import { StripePrice } from "./data/stripe-price";

export const StripePriceModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-prices",
    pageUrl: "/stripe-prices",
    model: StripePrice,
    moduleId: "a7d3e5f1-8c9b-4a2e-b6d7-3f1c8e9a4b5d",
  });
