import { ApiDataInterface } from "../../../../core";
import { StripeProductInterface } from "../../stripe-product";

// ============================================================================
// Stripe Price Interfaces
// ============================================================================

export interface StripePriceInterface extends ApiDataInterface {
  get stripePriceId(): string;
  get productId(): string;
  get product(): StripeProductInterface | undefined;
  get active(): boolean;
  get currency(): string;
  get unitAmount(): number | undefined;
  get recurring(): PriceRecurring | undefined;
  get priceType(): "one_time" | "recurring";
  get nickname(): string | undefined;
  get lookupKey(): string | undefined;
  get metadata(): Record<string, any> | undefined;
}

export interface PriceRecurring {
  interval: "day" | "week" | "month" | "year";
  intervalCount: number;
  usageType?: "metered" | "licensed";
}

// ============================================================================
// Stripe Price Input DTOs
// ============================================================================

export type StripePriceInput = {
  id: string;
  productId?: string; // Required for create, not for update
  currency?: string; // Required for create, not for update
  unitAmount?: number;
  recurring?: {
    interval: "day" | "week" | "month" | "year";
    intervalCount?: number;
    usageType?: "metered" | "licensed";
  };
  metadata?: Record<string, any>;
};
