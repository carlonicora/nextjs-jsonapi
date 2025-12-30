import { ApiDataInterface } from "../../../core";
import { SubscriptionInterface } from "./subscription.interface";

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

export interface InvoiceInterface extends ApiDataInterface {
  get stripeInvoiceId(): string;
  get stripeInvoiceNumber(): string | undefined;
  get customerId(): string | undefined;
  get subscriptionId(): string | undefined;
  get subscription(): SubscriptionInterface | undefined;
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
}

// ============================================================================
// Proration Preview Interfaces
// ============================================================================

export interface ProrationPreview {
  amountDue: number;
  currency: string;
  immediateCharge: number;
  prorationDate: Date;
  lineItems: ProrationLineItem[];
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
