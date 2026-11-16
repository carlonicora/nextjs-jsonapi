"use client";

import { useTranslations } from "next-intl";
import { DateRangeSelector } from "../../../components/forms/DateRangeSelector";
import { Button } from "../../../shadcnui";
import { cn } from "../../../utils";
import { ANALYTICS_GRANULARITIES, type AnalyticsGranularity } from "../data/analytics.types";

type FilterState = {
  from: string;
  to: string;
  granularity: AnalyticsGranularity;
};

type Props = FilterState & {
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
export function AnalyticsAdminFilterBar({ from, to, granularity, onChange }: Props) {
  const t = useTranslations();

  const granularityLabels: Record<AnalyticsGranularity, string> = {
    day: t("analytics.admin.filter.granularity_day"),
    week: t("analytics.admin.filter.granularity_week"),
    month: t("analytics.admin.filter.granularity_month"),
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* The date button is a fixed 300px; on a phone it takes the full row instead. */}
      <div className="max-md:w-full max-md:[&_#date]:w-full">
        <DateRangeSelector
          // The provider's window (last 30 days by default), so the button shows
          // the range the panels were fetched for, not the selector's own default.
          initialRange={{ from: new Date(from), to: new Date(to) }}
          onDateChange={(range) => {
            if (!range?.from || !range?.to) return;
            // The picker reports midnight at the START of each day, and the API
            // filters with startedAt <= to. Sending range.to as-is drops the last
            // day (and a one-day pick returns nothing), so send the END of that day
            // in the browser's local time.
            const to = new Date(range.to);
            to.setHours(23, 59, 59, 999);
            onChange({ from: range.from.toISOString(), to: to.toISOString() });
          }}
        />
      </div>

      <Segmented
        ariaLabel={t("analytics.admin.filter.granularity")}
        value={granularity}
        options={ANALYTICS_GRANULARITIES.map((value) => ({ value, label: granularityLabels[value] }))}
        onSelect={(value) => onChange({ granularity: value })}
      />
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
