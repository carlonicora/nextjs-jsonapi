"use client";

import { RoundPageContainer } from "../../../../../components";
import { Modules } from "../../../../../core";
import { BillingProvider } from "../../../contexts/BillingContext";
import { ProductsAdminContainer } from "./ProductsAdminContainer";

/**
 * Page shell around the Stripe product/price administration surface.
 *
 * Client component by necessity: `module={Modules.StripeProduct}` is a registry
 * entry with an icon component and methods, which a Server Component cannot pass
 * across the boundary.
 */
export function ProductsAdminPageContainer() {
  return (
    <BillingProvider>
      {/* forceHeader, unlike the sibling list pages: those get their header row
          (title + actions) from ContentListTable, and this page has no table.
          The strip is what renders BillingProvider's title and its create-product
          action — the same arrangement TokenUsageAdminContainer uses. */}
      <RoundPageContainer module={Modules.StripeProduct} fullWidth forceHeader>
        <ProductsAdminContainer />
      </RoundPageContainer>
    </BillingProvider>
  );
}
