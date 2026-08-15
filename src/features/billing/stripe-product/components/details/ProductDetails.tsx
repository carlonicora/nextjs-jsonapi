"use client";

import { useTranslations } from "next-intl";
import { DetailField, SectionHeader } from "../../../../../components";
import { Badge } from "../../../../../shadcnui";
import { useProductContext } from "../../../contexts/ProductContext";

export function ProductDetails() {
  const t = useTranslations();
  const { product } = useProductContext();

  if (!product) return null;

  return (
    <div className="flex w-full flex-col gap-y-4">
      <SectionHeader>{t("billing.admin.products.tabs.details")}</SectionHeader>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DetailField label={t("billing.admin.products.fields.name")} value={product.name} />
        <DetailField
          label={t("billing.admin.products.fields.status")}
          value={
            product.active ? (
              <Badge variant="softGreen">{t("billing.admin.products.status.active")}</Badge>
            ) : (
              <Badge variant="softGray">{t("billing.admin.products.status.archived")}</Badge>
            )
          }
        />
        <DetailField
          label={t("billing.admin.products.fields.description")}
          value={product.description ?? "—"}
          className="md:col-span-2"
        />
        <DetailField
          label={t("billing.admin.products.fields.prices")}
          value={<span className="tabular-nums">{product.stripePrices.length}</span>}
        />
        <DetailField
          label={t("billing.admin.products.fields.stripeId")}
          value={<span className="tabular-nums">{product.stripeProductId}</span>}
        />
      </div>
    </div>
  );
}
