"use client";

// Context and Provider
export * from "./context";

// Client-side hooks
export * from "./hooks";

// Client-side request utilities
export * from "./request";
export * from "./token";
export * from "./JsonApiClient";
export * from "./config";

// All hooks (merged from /hooks entry point)
export * from "../hooks";

// Table generator registration (must be in client-only context)
import { useCompanyTableStructure } from "../features/company/hooks";
import { useRoleTableStructure } from "../features/role/hooks";
import { useUserTableStructure } from "../features/user/hooks";
import { useStripePriceTableStructure } from "../features/billing/stripe-price/hooks/useStripePriceTableStructure";
import { useStripeProductTableStructure } from "../features/billing/stripe-product/hooks/useStripeProductTableStructure";
import { registerTableGenerator } from "../hooks";

export * from "../features/content/hooks";
export * from "../features/role/hooks";
export * from "../features/user/hooks";
export * from "../features/oauth/hooks";
export * from "../features/company/hooks/useSubscriptionStatus";

registerTableGenerator("roles", useRoleTableStructure);
registerTableGenerator("users", useUserTableStructure);
registerTableGenerator("companies", useCompanyTableStructure);
registerTableGenerator("stripe-products", useStripeProductTableStructure);
registerTableGenerator("stripe-prices", useStripePriceTableStructure);
// Note: Content registration moved to app-level to support app-specific cellTopic
