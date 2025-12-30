import { ModuleFactory } from "../../../permissions";
import { Invoice } from "../data/Invoice";

export const InvoiceModule = (factory: ModuleFactory) =>
  factory({
    name: "invoices",
    model: Invoice,
    moduleId: "37c73b8b-d3b1-4e5e-8fcb-a66d8ecfc05b",
  });
