import { ModuleFactory } from "../../../permissions";
import { StripeSubscription } from "./data";

export const StripeSubscriptionModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-subscriptions",
    model: StripeSubscription,
    moduleId: "5e8797ef-650b-4dd5-ac79-a2e530a6c7ba",
  });
