"use client";

import { DollarSignIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect } from "react";
import { ContentListTable } from "../../../../../components";
import { Modules } from "../../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../../hooks";
import { EmptyState } from "../../../../../shadcnui";
import { usePriceContext } from "../../../contexts/PriceContext";
import { StripePriceFields } from "../../data/stripe-price.fields";
import { StripePriceInterface } from "../../data/stripe-price.interface";
import { StripePriceService } from "../../data/stripe-price.service";
import PriceEditor from "../forms/PriceEditor";

type PricesListProps = {
  productId: string;
  /**
   * Only when the list IS the page's own content inside a `RoundPageContainer
   * fullWidth`. Inside a tab panel leave it unset, or ContentListTable drops its
   * own `rounded-md border` and the table floats borderless in the panel.
   * Mirrors ThreatList, which is rendered both ways.
   */
  fullWidth?: boolean;
};

export function PricesList({ productId, fullWidth }: PricesListProps) {
  const t = useTranslations();
  const { priceVersion } = usePriceContext();

  const data: DataListRetriever<StripePriceInterface> = useDataListRetriever({
    retriever: (params) => StripePriceService.listPrices({ ...params, productId }),
    retrieverParams: {},
    module: Modules.StripePrice,
  });

  useEffect(() => {
    if (priceVersion > 0) void data.refresh();
  }, [priceVersion]);

  const functions: ReactNode[] = [<PriceEditor key="create-price" productId={productId} />];

  return (
    <ContentListTable
      data={data}
      fields={[
        StripePriceFields.nickname,
        StripePriceFields.amount,
        StripePriceFields.interval,
        StripePriceFields.token,
        StripePriceFields.status,
      ]}
      tableGeneratorType={Modules.StripePrice}
      functions={functions}
      fullWidth={fullWidth}
      title={t("billing.admin.prices.title")}
      emptyState={
        <EmptyState
          icon={DollarSignIcon}
          title={t("billing.admin.prices.empty.title")}
          description={t("billing.admin.prices.empty.description")}
        />
      }
    />
  );
}
