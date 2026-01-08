"use client";

import { Tabs, TabsList, TabsTrigger } from "../../../../../shadcnui";

export type BillingInterval = "month" | "year";

export type IntervalToggleProps = {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  hasMonthly: boolean;
  hasYearly: boolean;
};

export function IntervalToggle({ value, onChange, hasMonthly, hasYearly }: IntervalToggleProps) {
  // Only render if BOTH intervals are available
  if (!hasMonthly || !hasYearly) {
    return null;
  }

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as BillingInterval)}>
      <TabsList>
        <TabsTrigger value="month">Monthly</TabsTrigger>
        <TabsTrigger value="year">Yearly</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
