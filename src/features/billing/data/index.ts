// Services
export { BillingService } from "./billing.service";

// Data classes
export { Billing } from "./Billing";

// Re-export from new sub-modules for backwards compatibility
// Invoice
export { Invoice, StripeInvoice } from "../stripe-invoice/data/stripe-invoice";
export { InvoiceStatus } from "../stripe-invoice/data/stripe-invoice.interface";
export type {
  InvoiceInterface,
  ProrationLineItem,
  ProrationPreviewInterface,
  StripeInvoiceInterface,
} from "../stripe-invoice/data/stripe-invoice.interface";

// Usage
export { UsageRecord, StripeUsage } from "../stripe-usage/data/stripe-usage";
export type {
  MeterInterface,
  MeterSummaryInterface,
  ReportUsageInput,
  UsageRecordInterface,
  UsageSummaryInterface,
  StripeUsageInterface,
} from "../stripe-usage/data/stripe-usage.interface";

// Payment Method
export type { PaymentMethodInterface } from "../stripe-customer/data/payment-method.interface";
