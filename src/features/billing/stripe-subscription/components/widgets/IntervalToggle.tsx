"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "../../../../../shadcnui";

export type BillingInterval = "month" | "year";

export type IntervalToggleProps = {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  hasMonthly: boolean;
  hasYearly: boolean;
};

export function IntervalToggle({ value, onChange, hasMonthly, hasYearly }: IntervalToggleProps) {
  const t = useTranslations();
  // Only render if BOTH intervals are available
  if (!hasMonthly || !hasYearly) {
    return null;
  }

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as BillingInterval)}>
      <TabsList>
        <TabsTrigger value="month">{t("billing.admin.prices.interval.month")}</TabsTrigger>
        <TabsTrigger value="year">{t("billing.admin.prices.interval.year")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
