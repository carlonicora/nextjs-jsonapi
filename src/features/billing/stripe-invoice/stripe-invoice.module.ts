import { ModuleFactory } from "../../../permissions";
import { StripeInvoice } from "./data/stripe-invoice";

export const StripeInvoiceModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-invoices",
    model: StripeInvoice,
    moduleId: "37c73b8b-d3b1-4e5e-8fcb-a66d8ecfc05b",
  });
