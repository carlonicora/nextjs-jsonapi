import { ModuleFactory } from "../../../permissions";
import { Billing } from "../data/Billing";

export const BillingModule = (factory: ModuleFactory) =>
  factory({
    name: "billing",
    pageUrl: "/billing",
    model: Billing,
    moduleId: "3266b307-5a9a-46f9-b78d-631f672f8735",
  });
