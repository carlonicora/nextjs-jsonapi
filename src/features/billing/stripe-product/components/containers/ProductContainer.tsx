"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../../../components";
import { Modules } from "../../../../../core";
import { PriceProvider } from "../../../contexts/PriceContext";
import { useProductContext } from "../../../contexts/ProductContext";
import { PricesList } from "../../../stripe-price/components/lists/PricesList";
import { ProductDetails } from "../details/ProductDetails";

export function ProductContainer() {
  const t = useTranslations();
  const { product } = useProductContext();

  if (!product) return null;

  return (
    <RoundPageContainer
      module={Modules.StripeProduct}
      id={product.id}
      tabs={[
        {
          sectionKey: "details",
          label: t("billing.admin.products.tabs.details"),
          content: <ProductDetails />,
        },
        {
          key: Modules.StripePrice,
          label: t("billing.admin.prices.title"),
          // publishChrome={false}: SharedProvider REPLACES its value for the
          // subtree (SharedContext.tsx:35-37), so a nested provider publishing
          // chrome here would blank this page's own title.
          // No `fillHeight` and no `fullWidth` on the list: a ContentListTable in
          // a tab keeps its own bordered card and flows with the panel, exactly
          // as ThreatList does inside GoalContainer.
          content: (
            <PriceProvider productId={product.id} publishChrome={false}>
              <PricesList productId={product.id} />
            </PriceProvider>
          ),
        },
      ]}
    />
  );
}
