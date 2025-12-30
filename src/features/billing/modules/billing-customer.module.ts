import { ModuleFactory } from "../../../permissions";
import { BillingCustomer } from "../data/BillingCustomer";

export const BillingCustomerModule = (factory: ModuleFactory) =>
  factory({
    name: "billing/customers",
    model: BillingCustomer,
    moduleId: "25a80cb3-bf18-47fd-963a-639212519920",
  });
