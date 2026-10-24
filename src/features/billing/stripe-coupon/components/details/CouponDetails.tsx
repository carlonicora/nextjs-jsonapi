"use client";

import { useTranslations } from "next-intl";
import { DetailField, SectionHeader } from "../../../../../components";
import { Badge } from "../../../../../shadcnui";
import { formatDate, useBillingFormatOptions } from "../../../components/utils";
import { useCouponContext } from "../../../contexts/CouponContext";
import { formatCouponDiscount } from "../../utils/format-coupon-discount";

export function CouponDetails() {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const { coupon } = useCouponContext();

  if (!coupon) return null;

  return (
    <div className="flex w-full flex-col gap-y-4">
      <SectionHeader>{t("billing.admin.products.tabs.details")}</SectionHeader>
      {/* Typography role 10 (helper text). */}
      <p className="text-muted-foreground text-xs/relaxed">{t("billing.admin.coupons.fixed_notice")}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DetailField label={t("billing.admin.coupons.fields.name")} value={coupon.name} />
        <DetailField
          label={t("billing.admin.coupons.fields.status")}
          value={
            coupon.valid ? (
              <Badge variant="softGreen">{t("billing.admin.coupons.status.active")}</Badge>
            ) : (
              <Badge variant="softGray">{t("billing.admin.coupons.status.ended")}</Badge>
            )
          }
        />
        <DetailField
          label={t("billing.admin.coupons.fields.discount")}
          value={<span className="tabular-nums">{formatCouponDiscount(coupon, t, fmt)}</span>}
        />
        <DetailField
          label={t("billing.admin.coupons.fields.places")}
          value={
            <span className="tabular-nums">
              {coupon.maxRedemptions !== undefined
                ? t("billing.admin.coupons.places.limited", {
                    used: String(coupon.timesRedeemed),
                    limit: String(coupon.maxRedemptions),
                  })
                : t("billing.admin.coupons.places.unlimited", { used: String(coupon.timesRedeemed) })}
            </span>
          }
        />
        <DetailField
          label={t("billing.admin.coupons.fields.products")}
          value={
            coupon.stripeProductIds.length > 0 ? (
              <span className="tabular-nums">{coupon.stripeProductIds.join(", ")}</span>
            ) : (
              t("billing.admin.coupons.all_products")
            )
          }
        />
        <DetailField
          label={t("billing.admin.coupons.fields.redeemBy")}
          value={<span className="tabular-nums">{coupon.redeemBy ? formatDate(coupon.redeemBy, fmt) : "—"}</span>}
        />
        <DetailField
          label={t("billing.admin.coupons.fields.stripeId")}
          value={<span className="tabular-nums">{coupon.stripeCouponId}</span>}
        />
      </div>
    </div>
  );
}
