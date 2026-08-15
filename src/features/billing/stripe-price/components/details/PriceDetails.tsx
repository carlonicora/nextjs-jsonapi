"use client";

import { useTranslations } from "next-intl";
import { DetailField, SectionHeader } from "../../../../../components";
import { Modules } from "../../../../../core";
import { usePageUrlGenerator } from "../../../../../hooks";
import { Badge, Link } from "../../../../../shadcnui";
import { formatCurrency, formatInterval } from "../../../components/utils/currency";
import { usePriceContext } from "../../../contexts/PriceContext";

export function PriceDetails() {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { price } = usePriceContext();

  if (!price) return null;

  const isRecurring = price.priceType === "recurring";

  return (
    <div className="flex w-full flex-col gap-y-8">
      <div className="flex w-full flex-col gap-y-4">
        <SectionHeader>{t("billing.admin.prices.title")}</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailField
            label={t("billing.admin.prices.fields.product")}
            value={
              price.product ? (
                <Link href={generateUrl({ page: Modules.StripeProduct, id: price.product.id })}>
                  {price.product.name}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <DetailField
            label={t("billing.admin.prices.fields.status")}
            value={
              <span className="flex flex-wrap items-center gap-1">
                {price.active ? (
                  <Badge variant="softGreen">{t("billing.admin.prices.status.active")}</Badge>
                ) : (
                  <Badge variant="softGray">{t("billing.admin.prices.status.archived")}</Badge>
                )}
                {price.isTrial && <Badge variant="softBlue">{t("billing.admin.prices.badge.trial")}</Badge>}
              </span>
            }
          />
          <DetailField
            label={t("billing.admin.prices.fields.amount")}
            value={<span className="tabular-nums">{formatCurrency(price.unitAmount, price.currency)}</span>}
          />
          <DetailField label={t("billing.admin.prices.fields.currency")} value={price.currency.toUpperCase()} />
          <DetailField
            label={t("billing.admin.prices.fields.type")}
            value={isRecurring ? t("billing.admin.prices.type.recurring") : t("billing.admin.prices.type.oneTime")}
          />
          <DetailField label={t("billing.admin.prices.fields.billing")} value={formatInterval(price)} />
          {isRecurring && (
            <DetailField
              label={t("billing.admin.prices.fields.intervalCount")}
              value={<span className="tabular-nums">{price.recurring?.intervalCount ?? 1}</span>}
            />
          )}
          {isRecurring && (
            <DetailField
              label={t("billing.admin.prices.fields.usageType")}
              value={
                price.recurring?.usageType === "metered"
                  ? t("billing.admin.prices.usage.metered")
                  : t("billing.admin.prices.usage.licensed")
              }
            />
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-y-4">
        <SectionHeader>{t("billing.admin.prices.fields.platformFeatures")}</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailField
            label={t("billing.admin.prices.fields.token")}
            value={<span className="tabular-nums">{price.token ?? "—"}</span>}
          />
          <DetailField
            label={t("billing.admin.prices.fields.stripeId")}
            value={<span className="tabular-nums">{price.stripePriceId}</span>}
          />
          <DetailField
            label={t("billing.admin.prices.fields.description")}
            value={price.description ?? "—"}
            className="md:col-span-2"
          />
          <DetailField
            label={t("billing.admin.prices.fields.features")}
            className="md:col-span-2"
            value={
              price.features && price.features.length > 0 ? (
                <ul className="flex flex-col gap-1 text-sm">
                  {price.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              ) : (
                "—"
              )
            }
          />
          <DetailField
            label={t("billing.admin.prices.fields.platformFeatures")}
            className="md:col-span-2"
            value={
              price.priceFeatures.length > 0 ? (
                <span className="flex flex-wrap items-center gap-1">
                  {price.priceFeatures.map((feature) => (
                    <Badge key={feature.id} variant="softGray">
                      {feature.name}
                    </Badge>
                  ))}
                </span>
              ) : (
                "—"
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
