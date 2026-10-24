"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../../../components";
import { Modules } from "../../../../../core";
import { useCouponContext } from "../../../contexts/CouponContext";
import { CouponDetails } from "../details/CouponDetails";
import { CouponCodesList } from "../lists/CouponCodesList";

export function CouponContainer() {
  const t = useTranslations();
  const { coupon } = useCouponContext();

  if (!coupon) return null;

  return (
    <RoundPageContainer
      module={Modules.StripeCoupon}
      id={coupon.id}
      tabs={[
        {
          sectionKey: "details",
          label: t("billing.admin.products.tabs.details"),
          content: <CouponDetails />,
        },
        {
          sectionKey: "codes",
          label: t("billing.admin.coupons.codes.title"),
          // No `fillHeight` and no `fullWidth` on the list: a ContentListTable in
          // a tab keeps its own bordered card and flows with the panel, exactly
          // as PricesList does inside ProductContainer. The codes list reads the
          // page's own CouponProvider, so no nested provider is needed.
          content: <CouponCodesList couponId={coupon.id} />,
        },
      ]}
    />
  );
}
