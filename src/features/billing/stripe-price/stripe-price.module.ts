import { ModuleFactory } from "../../../permissions";
import { StripePrice } from "./data/stripe-price";

export const StripePriceModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-prices",
    // The administration route this entity is served at. `name` above stays the
    // API endpoint; this drives generateUrl / rewriteUrl / EditorSheet
    // navigation, so it must match the real Next.js route or RoundPageContainer
    // rewrites the URL to a 404 on the first tab change.
    pageUrl: "/administration/prices",
    model: StripePrice,
    moduleId: "a7d3e5f1-8c9b-4a2e-b6d7-3f1c8e9a4b5d",
  });
