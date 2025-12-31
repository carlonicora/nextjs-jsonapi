import { ModuleFactory } from "../../../permissions";
import { StripeUsage } from "./data/stripe-usage";

export const StripeUsageModule = (factory: ModuleFactory) =>
  factory({
    name: "usage-records",
    model: StripeUsage,
    moduleId: "c2e9f4a6-1d7b-4e3a-8f5c-9b2d6a1e7f3c",
  });

// Backwards compatibility alias
export { StripeUsageModule as UsageRecordModule };
