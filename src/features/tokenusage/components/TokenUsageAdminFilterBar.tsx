"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DateRangeSelector } from "../../../components/forms/DateRangeSelector";
import EntitySelector from "../../../components/forms/EntitySelector";
import { Modules } from "../../../core";
import { Button } from "../../../shadcnui";
import { cn } from "../../../utils";
import { CompanyInterface } from "../../company/data/company.interface";
import { CompanyService } from "../../company/data/company.service";
import type { Granularity, Metric } from "../data/tokenusage-admin.types";

type FilterState = {
  from: string;
  to: string;
  granularity: Granularity;
  companyId?: string;
  metric: Metric;
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
export function TokenUsageAdminFilterBar({ granularity, companyId, metric, onChange }: Props) {
  const t = useTranslations();
  const form = useForm<{ company?: { id: string; name: string } }>({ defaultValues: { company: undefined } });

  // The company picker is the library's EntitySelector (copies SkillsAdminContainer):
  // it searches every company on the server a page at a time. A companyId set from
  // outside (the provider's initialCompanyId) is read once so its name shows.
  useEffect(() => {
    if (!companyId) {
      form.setValue("company", undefined);
      return;
    }
    if (form.getValues("company")?.id === companyId) return;
    let active = true;
    CompanyService.findOne({ companyId })
      .then((found) => {
        if (!active) return;
        form.setValue("company", { id: found.id, name: found.name });
      })
      .catch(() => {
        // An id that is not a company falls back to all companies.
        if (active) onChange({ companyId: undefined });
      });
    return () => {
      active = false;
    };
  }, [companyId]);

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

      <div className="w-56 min-w-0 shrink" data-testid="token-usage-company-picker">
        <EntitySelector<CompanyInterface>
          id="company"
          form={form}
          module={Modules.Company}
          retriever={(params) => CompanyService.findMany({ ...params, sort: "name" })}
          noneLabel={t("token_usage.admin.all_companies")}
          onChange={(picked) => onChange({ companyId: picked?.id })}
        />
      </div>
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
