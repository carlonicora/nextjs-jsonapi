"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../../../components";
import { Modules } from "../../../../../core";
import { CouponProvider } from "../../../contexts/CouponContext";
import { ProductProvider } from "../../../contexts/ProductContext";
import { CouponsList } from "../../../stripe-coupon/components/lists/CouponsList";
import { ProductsList } from "../lists/ProductsList";

/**
 * Page container for the administrative products page: two tabs, Products and
 * Codes, with `sectionKey`s so the URL keeps the tab (`?section=codes`).
 *
 * Client component by necessity: `module={Modules.StripeProduct}` is a registry
 * entry carrying an icon component and methods, which a Server Component cannot
 * pass across the boundary. Routes mount this container instead — the same
 * shape as every other list page.
 *
 * No `fullWidth`, on the page or the lists: the page keeps its title bar and
 * each ContentListTable keeps its own bordered card in the tab (see ProductContainer). CouponProvider
 * is nested with `publishChrome={false}`: SharedProvider REPLACES its value for
 * the subtree (SharedContext.tsx:35-37), so a nested provider publishing chrome
 * would blank the products page's own title.
 */
export function ProductsListContainer() {
  const t = useTranslations();

  return (
    <ProductProvider>
      <CouponProvider publishChrome={false}>
        <RoundPageContainer
          module={Modules.StripeProduct}
          tabs={[
            { sectionKey: "products", label: t("billing.admin.products.tabs.products"), content: <ProductsList /> },
            { sectionKey: "codes", label: t("billing.admin.products.tabs.codes"), content: <CouponsList /> },
          ]}
        />
      </CouponProvider>
    </ProductProvider>
  );
}
