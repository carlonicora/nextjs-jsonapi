// ============================================================================
// Subscription Enums
// ============================================================================

import { ApiDataInterface, StripePriceInterface } from "../../../../core";

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

export interface StripeSubscriptionInterface extends ApiDataInterface {
  get stripeSubscriptionId(): string;
  get status(): SubscriptionStatus;
  get currentPeriodStart(): Date;
  get currentPeriodEnd(): Date;
  get cancelAtPeriodEnd(): boolean;
  get canceledAt(): Date | undefined;
  get trialStart(): Date | undefined;
  get trialEnd(): Date | undefined;
  get price(): StripePriceInterface | undefined;
}

// ============================================================================
// Subscription Input DTOs
// ============================================================================

export type StripeSubscriptionInput = {
  id: string;
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

// ============================================================================
// Subscription Response Types (for SCA payment confirmation)
// ============================================================================

export interface StripeSubscriptionCreateMeta {
  clientSecret: string | null;
  paymentIntentId: string | null;
  requiresAction: boolean;
}

export interface StripeSubscriptionCreateResponse {
  subscription: StripeSubscriptionInterface;
  meta: StripeSubscriptionCreateMeta;
}
