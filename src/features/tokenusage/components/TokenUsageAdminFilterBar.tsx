"use client";

import { useTranslations } from "next-intl";
import { DateRangeSelector } from "../../../components/forms/DateRangeSelector";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shadcnui";
import { cn } from "../../../utils";
import type { Granularity, Metric } from "../data/tokenusage-admin.types";

/** Sentinel for "no company filter" — Base UI Select cannot hold `undefined`. */
const ALL_COMPANIES = "all";

type FilterState = {
  from: string;
  to: string;
  granularity: Granularity;
  companyId?: string;
  metric: Metric;
};

type Props = FilterState & {
  companies: { id: string; label: string }[];
  /** Receives ONLY the keys that changed. */
  onChange: (next: Partial<FilterState>) => void;
};

/**
 * The single control row above the KPI tiles.
 *
 * It is deliberately stateless: every control reports the one key it changed and
 * the owning context re-fetches. Keeping the whole filter state in one place is
 * what lets the page issue a single coordinated batch of requests instead of one
 * per control.
 */
export function TokenUsageAdminFilterBar({ granularity, companyId, metric, companies, onChange }: Props) {
  const t = useTranslations();

  const companyItems: Record<string, string> = {
    [ALL_COMPANIES]: t("token_usage.admin.all_companies"),
    ...Object.fromEntries(companies.map((company) => [company.id, company.label])),
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangeSelector
        onDateChange={(range) => {
          if (!range?.from || !range?.to) return;
          onChange({ from: range.from.toISOString(), to: range.to.toISOString() });
        }}
      />

      <Segmented
        ariaLabel={t("token_usage.admin.granularity.label")}
        value={granularity}
        options={[
          { value: "day", label: t("token_usage.admin.granularity.day") },
          { value: "week", label: t("token_usage.admin.granularity.week") },
          { value: "month", label: t("token_usage.admin.granularity.month") },
        ]}
        onSelect={(value) => onChange({ granularity: value })}
      />

      <Segmented
        ariaLabel={t("token_usage.admin.metric.label")}
        value={metric}
        options={[
          { value: "cost", label: t("token_usage.admin.metric.cost") },
          { value: "credits", label: t("token_usage.admin.metric.credits") },
          { value: "tokens", label: t("token_usage.admin.metric.tokens") },
        ]}
        onSelect={(value) => onChange({ metric: value })}
      />

      <Select
        items={companyItems}
        value={companyId ?? ALL_COMPANIES}
        onValueChange={(value) =>
          onChange({ companyId: !value || value === ALL_COMPANIES ? undefined : (value as string) })
        }
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder={t("token_usage.admin.all_companies")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_COMPANIES}>{t("token_usage.admin.all_companies")}</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * A segmented control built from plain Buttons.
 *
 * The design system has no ToggleGroup primitive, and Base UI triggers may never
 * wrap a Button, so the segmented look is composed from Buttons directly — the
 * selected segment takes the solid variant, the rest stay ghosts.
 */
function Segmented<T extends string>({
  ariaLabel,
  value,
  options,
  onSelect,
}: {
  ariaLabel: string;
  value: T;
  options: { value: T; label: string }[];
  onSelect: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="border-border inline-flex items-center gap-0.5 rounded-md border p-0.5"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={selected ? "default" : "ghost"}
            aria-pressed={selected}
            className={cn(!selected && "text-muted-foreground")}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
