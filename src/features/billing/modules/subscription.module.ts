import { ModuleFactory } from "../../../permissions";
import { Subscription } from "../data/Subscription";

export const SubscriptionModule = (factory: ModuleFactory) =>
  factory({
    name: "subscriptions",
    model: Subscription,
    moduleId: "5e8797ef-650b-4dd5-ac79-a2e530a6c7ba",
  });
