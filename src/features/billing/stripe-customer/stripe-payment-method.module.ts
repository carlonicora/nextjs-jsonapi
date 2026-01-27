import { ModuleFactory } from "../../../permissions";
import { PaymentMethod } from "./data/payment-method";

export const StripePaymentMethodModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-payment-methods",
    pageUrl: "/stripe-payment-methods",
    model: PaymentMethod,
    moduleId: "e8f7d6c5-b4a3-4928-8170-1f2e3d4c5b6a",
  });
