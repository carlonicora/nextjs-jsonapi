import { ApiDataInterface } from "../../../../core";
import { StripeProductInterface } from "../../stripe-product";
import { FeatureInterface } from "../../../feature";

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
  get description(): string | undefined;
  get features(): string[] | undefined;
  get token(): number | undefined;
  get priceFeatures(): FeatureInterface[]; // Platform Feature entities linked to this price
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
  nickname?: string;
  recurring?: {
    interval: "day" | "week" | "month" | "year";
    intervalCount?: number;
    usageType?: "metered" | "licensed";
  };
  metadata?: Record<string, any>;
  description?: string;
  features?: string[];
  token?: number;
  featureIds?: string[]; // Feature entity IDs to link (Neo4j only, NOT sent to Stripe)
};
