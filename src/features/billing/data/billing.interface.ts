import { ApiDataInterface } from "../../../core";

// ============================================================================
// Enums
// ============================================================================

export enum SubscriptionStatus {
  ACTIVE = "active",
  PAST_DUE = "past_due",
  UNPAID = "unpaid",
  CANCELED = "canceled",
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  TRIALING = "trialing",
  PAUSED = "paused",
}

export enum InvoiceStatus {
  DRAFT = "draft",
  OPEN = "open",
  PAID = "paid",
  UNCOLLECTIBLE = "uncollectible",
  VOID = "void",
}

// ============================================================================
// Core Interfaces
// ============================================================================

export interface BillingCustomerInterface extends ApiDataInterface {
  get stripeCustomerId(): string;
  get email(): string | undefined;
  get name(): string | undefined;
  get defaultPaymentMethodId(): string | undefined;
  get currency(): string | undefined;
  get balance(): number | undefined;
  get delinquent(): boolean;
  get metadata(): Record<string, any> | undefined;
}

export interface SubscriptionInterface extends ApiDataInterface {
  get stripeSubscriptionId(): string;
  get customerId(): string;
  get status(): SubscriptionStatus;
  get currentPeriodStart(): Date;
  get currentPeriodEnd(): Date;
  get cancelAtPeriodEnd(): boolean;
  get canceledAt(): Date | undefined;
  get trialStart(): Date | undefined;
  get trialEnd(): Date | undefined;
  get metadata(): Record<string, any> | undefined;
  get items(): SubscriptionItem[];
  get price(): StripePriceInterface | undefined;
}

export interface SubscriptionItem {
  id: string;
  priceId: string;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface InvoiceInterface extends ApiDataInterface {
  get stripeInvoiceId(): string;
  get stripeInvoiceNumber(): string | undefined;
  get customerId(): string;
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

export interface StripeProductInterface extends ApiDataInterface {
  get stripeProductId(): string;
  get name(): string;
  get description(): string | undefined;
  get active(): boolean;
  get metadata(): Record<string, any> | undefined;
  get images(): string[];
  get unitLabel(): string | undefined;
}

export interface StripePriceInterface extends ApiDataInterface {
  get stripePriceId(): string;
  get productId(): string;
  get product(): StripeProductInterface | undefined;
  get active(): boolean;
  get currency(): string;
  get unitAmount(): number | undefined;
  get recurring(): PriceRecurring | undefined;
  get type(): "one_time" | "recurring";
  get metadata(): Record<string, any> | undefined;
}

export interface PriceRecurring {
  interval: "day" | "week" | "month" | "year";
  intervalCount: number;
  usageType?: "metered" | "licensed";
}

export interface UsageRecordInterface extends ApiDataInterface {
  get subscriptionItemId(): string;
  get quantity(): number;
  get timestamp(): Date;
  get action(): "increment" | "set";
}

// ============================================================================
// Payment Method Interfaces
// ============================================================================

export interface PaymentMethodInterface {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postalCode?: string;
      state?: string;
    };
  };
}

// ============================================================================
// Usage Tracking Interfaces
// ============================================================================

export interface MeterInterface {
  id: string;
  displayName: string;
  eventName: string;
  status: string;
}

export interface MeterSummaryInterface {
  meterId: string;
  start: Date;
  end: Date;
  aggregatedValue: number;
}

export interface UsageSummaryInterface {
  subscriptionItemId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalUsage: number;
}

// ============================================================================
// Input DTOs
// ============================================================================

export type CreateSubscriptionInput = {
  priceId: string;
  quantity?: number;
  trialPeriodDays?: number;
  metadata?: Record<string, any>;
};

export type ChangePlanInput = {
  subscriptionId: string;
  newPriceId: string;
  quantity?: number;
  prorationBehavior?: "create_prorations" | "none" | "always_invoice";
};

export type CancelSubscriptionInput = {
  subscriptionId: string;
  immediate?: boolean;
  reason?: string;
};

export type CreateProductInput = {
  name: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, any>;
  unitLabel?: string;
  images?: string[];
};

export type UpdateProductInput = {
  productId: string;
  name?: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, any>;
};

export type CreatePriceInput = {
  productId: string;
  currency: string;
  unitAmount?: number;
  recurring?: {
    interval: "day" | "week" | "month" | "year";
    intervalCount?: number;
    usageType?: "metered" | "licensed";
  };
  metadata?: Record<string, any>;
};

export type UpdatePriceInput = {
  priceId: string;
  active?: boolean;
  metadata?: Record<string, any>;
};

export type ReportUsageInput = {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: "increment" | "set";
};

// ============================================================================
// Proration Preview Interface
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
