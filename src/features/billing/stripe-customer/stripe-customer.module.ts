import { ModuleFactory } from "../../../permissions";
import { StripeCustomer } from "./data";

export const StripeCustomerModule = (factory: ModuleFactory) =>
  factory({
    name: "billing/customers",
    model: StripeCustomer,
    moduleId: "25a80cb3-bf18-47fd-963a-639212519920",
  });
