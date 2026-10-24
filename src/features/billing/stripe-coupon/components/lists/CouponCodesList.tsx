"use client";

import { TicketIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect } from "react";
import { ContentListTable } from "../../../../../components";
import { Modules } from "../../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../../hooks";
import { EmptyState } from "../../../../../shadcnui";
import { useCouponContext } from "../../../contexts/CouponContext";
import { StripeCouponCodeFields } from "../../data/stripe-coupon-code.fields";
import { StripeCouponCodeInterface } from "../../data/stripe-coupon-code.interface";
import { StripeCouponCodeService } from "../../data/stripe-coupon-code.service";
import CouponCodeEditor from "../forms/CouponCodeEditor";

type CouponCodesListProps = {
  couponId: string;
};

export function CouponCodesList({ couponId }: CouponCodesListProps) {
  const t = useTranslations();
  const { catalogueVersion } = useCouponContext();

  const data: DataListRetriever<StripeCouponCodeInterface> = useDataListRetriever({
    retriever: (params) => StripeCouponCodeService.listByCoupon({ ...params, couponId }),
    retrieverParams: {},
    module: Modules.StripeCouponCode,
  });

  // Switching "Apply automatically" on one code clears it on the others in the
  // same server write, so every flag change re-reads the whole list.
  useEffect(() => {
    if (catalogueVersion > 0) void data.refresh();
  }, [catalogueVersion]);

  const functions: ReactNode[] = [<CouponCodeEditor key="create-code" couponId={couponId} />];

  return (
    <ContentListTable
      data={data}
      fields={[
        StripeCouponCodeFields.code,
        StripeCouponCodeFields.places,
        StripeCouponCodeFields.expiresAt,
        StripeCouponCodeFields.automatic,
        StripeCouponCodeFields.status,
        StripeCouponCodeFields.actions,
      ]}
      tableGeneratorType={Modules.StripeCouponCode}
      functions={functions}
      title={t("billing.admin.coupons.codes.title")}
      emptyState={
        <EmptyState
          icon={TicketIcon}
          title={t("billing.admin.coupons.codes.empty.title")}
          description={t("billing.admin.coupons.codes.empty.description")}
        />
      }
    />
  );
}
