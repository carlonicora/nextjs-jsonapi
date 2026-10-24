"use client";

import { TicketPercentIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect } from "react";
import { ContentListTable } from "../../../../../components";
import { Modules } from "../../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../../hooks";
import { EmptyState } from "../../../../../shadcnui";
import { useCouponContext } from "../../../contexts/CouponContext";
import { StripeCouponFields } from "../../data/stripe-coupon.fields";
import { StripeCouponInterface } from "../../data/stripe-coupon.interface";
import { StripeCouponService } from "../../data/stripe-coupon.service";
import CouponEditor from "../forms/CouponEditor";

type CouponsListProps = {
  /**
   * Pass this whenever the list is the page's own content inside a
   * `RoundPageContainer fullWidth`. Without it ContentListTable wraps itself in
   * `rounded-md border`, drawing a second bordered card inside the page's
   * rounded shell.
   */
  fullWidth?: boolean;
};

export function CouponsList({ fullWidth }: CouponsListProps = {}) {
  const t = useTranslations();
  const { catalogueVersion } = useCouponContext();

  const data: DataListRetriever<StripeCouponInterface> = useDataListRetriever({
    retriever: (params) => StripeCouponService.listCoupons(params),
    retrieverParams: {},
    module: Modules.StripeCoupon,
  });

  // Renames and code changes happen on the detail page, so the list has to
  // learn about them through the provider's counter rather than a direct callback.
  useEffect(() => {
    if (catalogueVersion > 0) void data.refresh();
  }, [catalogueVersion]);

  const functions: ReactNode[] = [<CouponEditor key="create-coupon" />];

  return (
    <ContentListTable
      data={data}
      fields={[
        StripeCouponFields.name,
        StripeCouponFields.discount,
        StripeCouponFields.places,
        StripeCouponFields.codes,
        StripeCouponFields.status,
      ]}
      tableGeneratorType={Modules.StripeCoupon}
      functions={functions}
      fullWidth={fullWidth}
      title={t("billing.admin.coupons.title")}
      emptyState={
        <EmptyState
          icon={TicketPercentIcon}
          title={t("billing.admin.coupons.empty.title")}
          description={t("billing.admin.coupons.empty.description")}
        />
      }
    />
  );
}
