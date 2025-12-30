import { ModuleFactory } from "../../../permissions";
import { StripeBillingCustomer } from "./data";

export const StripeBillingCustomerModule = (factory: ModuleFactory) =>
  factory({
    name: "billing/customers",
    model: StripeBillingCustomer,
    moduleId: "25a80cb3-bf18-47fd-963a-639212519920",
  });
