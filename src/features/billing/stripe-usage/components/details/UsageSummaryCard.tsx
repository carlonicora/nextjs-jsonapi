"use client";

import { useTranslations } from "next-intl";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../../../shadcnui";
import { type BillingFormatOptions, formatFixed, useBillingFormatOptions } from "../../../components/utils";
import { MeterInterface, MeterSummaryInterface } from "../../data/stripe-usage.interface";

type UsageSummaryCardProps = {
  meter: MeterInterface;
  summary: MeterSummaryInterface | null;
};

/**
 * Get progress bar color based on usage percentage
 */
function getProgressColor(percentage: number | null): string {
  if (percentage === null) return "bg-blue-500";
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 75) return "bg-orange-500";
  return "bg-green-500";
}

/**
 * Format a Unix timestamp to readable date
 */
function formatDate(date: Date | undefined, { locale, t }: Required<BillingFormatOptions>): string {
  if (!date) return t("billing.ui.not_available");

  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  } catch (_error) {
    return t("billing.ui.invalid_date");
  }
}

export function UsageSummaryCard({ meter, summary }: UsageSummaryCardProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const currentUsage = summary?.aggregatedValue ?? 0;
  const limit = (meter as any).limit; // Meters may have optional limit field
  const percentage = limit && limit > 0 ? (currentUsage / limit) * 100 : null;
  const progressColor = getProgressColor(percentage);
  const progressWidth = percentage !== null ? Math.min(percentage, 100) : 0;

  const displayName = meter.displayName || meter.eventName;
  const hasLimit = limit !== null && limit !== undefined;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-x-3 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-medium">{displayName}</h3>
          <p className="text-muted-foreground text-xs">{meter.id}</p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-4">
        {/* Current Usage */}
        <div>
          <p className="text-3xl font-bold">{currentUsage.toLocaleString(fmt.locale)}</p>
          {hasLimit && (
            <p className="text-muted-foreground text-sm">
              {t("billing.ui.usage.of_limit_used", { limit: limit.toLocaleString(fmt.locale) })}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {hasLimit ? (
          <div className="flex flex-col gap-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className={`h-full transition-all ${progressColor}`} style={{ width: `${progressWidth}%` }} />
            </div>
            <p className="text-muted-foreground text-sm">
              {t("billing.ui.usage.percent_used", {
                value: percentage !== null ? formatFixed(percentage, fmt.locale, 1) : "",
              })}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("billing.ui.usage.no_limit")}</p>
        )}

        {/* Period Information */}
        {summary && summary.start && summary.end && (
          <div className="border-t pt-3">
            <p className="text-muted-foreground text-xs">
              {t("billing.ui.usage.period", {
                start: formatDate(summary.start, fmt),
                end: formatDate(summary.end, fmt),
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
