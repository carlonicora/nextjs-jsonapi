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
  // For CREATE - goes to relationships.stripePrice
  priceId?: string;
  // For CHANGE-PLAN - goes to attributes.priceId
  newPriceId?: string;
  // For CANCEL - goes to attributes.cancelImmediately
  cancelImmediately?: boolean;
  // Shared optional fields
  quantity?: number;
  trialPeriodDays?: number;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
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
