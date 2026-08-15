import { ModuleFactory } from "../../../permissions";
import { StripeProduct } from "./data";

export const StripeProductModule = (factory: ModuleFactory) =>
  factory({
    name: "stripe-products",
    // The administration route this entity is served at. `name` above stays the
    // API endpoint; this drives generateUrl / rewriteUrl / EditorSheet
    // navigation, so it must match the real Next.js route or RoundPageContainer
    // rewrites the URL to a 404 on the first tab change.
    pageUrl: "/administration/products",
    model: StripeProduct,
    moduleId: "f8c4a1e9-3b2d-4f7a-9e5c-1d8a6b3c9f2e",
  });
