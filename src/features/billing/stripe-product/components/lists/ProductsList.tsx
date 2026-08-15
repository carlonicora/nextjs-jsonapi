"use client";

import { PackageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect } from "react";
import { ContentListTable } from "../../../../../components";
import { Modules } from "../../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../../hooks";
import { EmptyState } from "../../../../../shadcnui";
import { useProductContext } from "../../../contexts/ProductContext";
import { StripeProductFields } from "../../data/stripe-product.fields";
import { StripeProductInterface } from "../../data/stripe-product.interface";
import { StripeProductService } from "../../data/stripe-product.service";
import ProductEditor from "../forms/ProductEditor";

type ProductsListProps = {
  /**
   * Pass this whenever the list is the page's own content inside a
   * `RoundPageContainer fullWidth`. Without it ContentListTable wraps itself in
   * `rounded-md border`, drawing a second bordered card inside the page's
   * rounded shell.
   */
  fullWidth?: boolean;
};

export function ProductsList({ fullWidth }: ProductsListProps = {}) {
  const t = useTranslations();
  const { catalogueVersion } = useProductContext();

  const data: DataListRetriever<StripeProductInterface> = useDataListRetriever({
    retriever: (params) => StripeProductService.listProducts(params),
    retrieverParams: {},
    module: Modules.StripeProduct,
  });

  // Archiving and restoring happen on the detail page, so the list has to learn
  // about them through the provider's counter rather than a direct callback.
  useEffect(() => {
    if (catalogueVersion > 0) void data.refresh();
  }, [catalogueVersion]);

  const functions: ReactNode[] = [<ProductEditor key="create-product" />];

  return (
    <ContentListTable
      data={data}
      fields={[StripeProductFields.name, StripeProductFields.status, StripeProductFields.prices]}
      tableGeneratorType={Modules.StripeProduct}
      functions={functions}
      fullWidth={fullWidth}
      title={t("billing.admin.products.title")}
      emptyState={
        <EmptyState
          icon={PackageIcon}
          title={t("billing.admin.products.empty.title")}
          description={t("billing.admin.products.empty.description")}
        />
      }
    />
  );
}
