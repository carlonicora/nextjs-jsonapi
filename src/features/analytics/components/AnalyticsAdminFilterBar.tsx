"use client";

import { useTranslations } from "next-intl";
import { DateRangeSelector } from "../../../components/forms/DateRangeSelector";
import { Button } from "../../../shadcnui";
import { cn } from "../../../utils";
import {
  ANALYTICS_GRANULARITIES,
  ANALYTICS_SECTIONS,
  type AnalyticsGranularity,
  type AnalyticsSection,
} from "../data/analytics.types";

type FilterState = {
  from: string;
  to: string;
  section: AnalyticsSection;
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
export function AnalyticsAdminFilterBar({ section, granularity, onChange }: Props) {
  const t = useTranslations();

  const sectionLabels: Record<AnalyticsSection, string> = {
    all: t("analytics.admin.filter.section_all"),
    public: t("analytics.admin.filter.section_public"),
    app: t("analytics.admin.filter.section_app"),
  };

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
          onDateChange={(range) => {
            if (!range?.from || !range?.to) return;
            onChange({ from: range.from.toISOString(), to: range.to.toISOString() });
          }}
        />
      </div>

      <Segmented
        ariaLabel={t("analytics.admin.filter.section")}
        value={section}
        options={ANALYTICS_SECTIONS.map((value) => ({ value, label: sectionLabels[value] }))}
        onSelect={(value) => onChange({ section: value })}
      />

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
