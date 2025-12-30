import { ApiDataInterface } from "../../../core";
import { StripePriceInterface } from "../stripe-price/data/stripe-price.interface";

// ============================================================================
// Subscription Enums
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

// ============================================================================
// Subscription Interfaces
// ============================================================================

export interface SubscriptionInterface extends ApiDataInterface {
  get stripeSubscriptionId(): string;
  get customerId(): string | undefined;
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

// ============================================================================
// Subscription Input DTOs
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
