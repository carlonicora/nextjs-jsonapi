import { ModuleFactory } from "../../../permissions";
import { StripeProduct } from "./data";

export const StripeProductModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-products",
    model: StripeProduct,
    moduleId: "f8c4a1e9-3b2d-4f7a-9e5c-1d8a6b3c9f2e",
  });
