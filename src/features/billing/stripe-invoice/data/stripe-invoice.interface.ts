import { ApiDataInterface, StripeSubscriptionInterface } from "../../../../core";
import { StripePriceInterface } from "../../stripe-price/data/stripe-price.interface";

// ============================================================================
// Invoice Enums
// ============================================================================

export enum InvoiceStatus {
  DRAFT = "draft",
  OPEN = "open",
  PAID = "paid",
  UNCOLLECTIBLE = "uncollectible",
  VOID = "void",
}

// ============================================================================
// Invoice Interfaces
// ============================================================================

export interface StripeInvoiceInterface extends ApiDataInterface {
  get stripeInvoiceId(): string;
  get stripeInvoiceNumber(): string | undefined;
  get customerId(): string | undefined;
  get subscriptionId(): string | undefined;
  get subscription(): StripeSubscriptionInterface | undefined;
  get status(): InvoiceStatus;
  get amountDue(): number;
  get amountPaid(): number;
  get amountRemaining(): number;
  get subtotal(): number;
  get total(): number;
  get tax(): number | undefined;
  get currency(): string;
  get periodStart(): Date;
  get periodEnd(): Date;
  get dueDate(): Date | undefined;
  get paidAt(): Date | undefined;
  get attemptCount(): number;
  get attempted(): boolean;
  get stripeHostedInvoiceUrl(): string | undefined;
  get stripePdfUrl(): string | undefined;
  get paid(): boolean;
  get metadata(): Record<string, any> | undefined;
  /** Start of the period the invoice's first non-proration line covers (admin reads). */
  get servicePeriodStart(): Date | undefined;
  /** End of the period the invoice's first non-proration line covers (admin reads). */
  get servicePeriodEnd(): Date | undefined;
  /** The price the invoice's first non-proration line was for, when known locally. */
  get stripePrice(): StripePriceInterface | undefined;
  /** Whether the invoice belongs to a subscription; sent by the admin company invoices list only. */
  get forSubscription(): boolean | undefined;
}

// ============================================================================
// Proration Preview Interfaces
// ============================================================================

export interface ProrationPreviewInterface {
  amountDue: number;
  currency: string;
  immediateCharge: number;
  prorationDate: Date;
  lineItems: ProrationLineItem[];
  isTrialUpgrade?: boolean;
}

export interface ProrationLineItem {
  description: string;
  amount: number;
  proration: boolean;
  period: {
    start: Date;
    end: Date;
  };
}
