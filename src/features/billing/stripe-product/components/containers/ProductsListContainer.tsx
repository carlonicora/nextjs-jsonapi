"use client";

import { RoundPageContainer } from "../../../../../components";
import { Modules } from "../../../../../core";
import { ProductProvider } from "../../../contexts/ProductContext";
import { ProductsList } from "../lists/ProductsList";

/**
 * Page container for the administrative product list.
 *
 * Client component by necessity: `module={Modules.StripeProduct}` is a registry
 * entry carrying an icon component and methods, which a Server Component cannot
 * pass across the boundary. Routes mount this container instead — the same
 * shape as every other list page.
 *
 * No `forceHeader`: ContentListTable draws its own header row with the title
 * and the create action, exactly as the company and user list pages do.
 */
export function ProductsListContainer() {
  return (
    <ProductProvider>
      <RoundPageContainer module={Modules.StripeProduct} fullWidth>
        <ProductsList fullWidth />
      </RoundPageContainer>
    </ProductProvider>
  );
}
