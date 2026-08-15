"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "../../../shadcnui";
import { cn } from "../../../utils";
import type { TokenUsageReportSummaryInterface } from "../data/tokenusage-report-summary.interface";
import type { ReportMetric } from "../data/tokenusage-report.types";
import { useUsageFormatters } from "../lib/formatters";
import { metricValue, percentageDelta, type TokenUsageMetrics } from "../lib/metrics";

/**
 * The caller's own credit position, as the host app reads it from its
 * CurrentUserContext. The package has no access to that context, so the numbers
 * arrive as a prop.
 */
export type TokenUsageBalances = {
  monthlyCredits: number;
  availableMonthlyCredits: number;
  availableExtraCredits: number;
};

type Props = {
  /** Two rows: window "current" and "previous". */
  summary: TokenUsageReportSummaryInterface[];
  metric: ReportMetric;
  /** The caller's own balances, read from CurrentUserContext by the container. */
  balances: TokenUsageBalances | null;
};

const ZERO: TokenUsageMetrics = { cost: 0, credits: 0, tokensIn: 0, tokensOut: 0, cached: 0, calls: 0 };

/**
 * The KPI header of the self-service token-usage page.
 *
 * One lead tile carries the number the page exists to answer — how much was
 * spent in the period — with its delta against the equal-length preceding
 * window. Three supporting tiles give it context: what is left this month, what
 * extra sits behind that, and how many calls produced the spend.
 *
 * Credits are fractional. Customer-facing BALANCES are floored to whole credits
 * (Math.max(0, Math.floor(v))) so nobody is told they have 715.4 of something
 * indivisible; the percentage arithmetic behind the colour keeps the raw floats.
 * Spend is NOT floored — it is a measurement, not a wallet.
 */
export function TokenUsageReportTiles({ summary, metric, balances }: Props) {
  const t = useTranslations();
  const { decimal, metricValue: formatValue } = useUsageFormatters();

  const rowFor = (window: string): TokenUsageMetrics => summary.find((row) => row.window === window) ?? ZERO;

  const current = rowFor("current");
  const previous = rowFor("previous");

  const monthlyPercentage =
    balances && balances.monthlyCredits > 0 ? (balances.availableMonthlyCredits / balances.monthlyCredits) * 100 : 0;

  // Three bands, not four: the previous implementation had a dead branch where
  // >= 25 and >= 5 both returned the same class.
  const monthlyColor =
    monthlyPercentage > 75 ? "text-success" : monthlyPercentage >= 5 ? "text-warning" : "text-destructive";

  const whole = (value: number) => decimal(Math.max(0, Math.floor(value)), 0);

  return (
    <div className="grid gap-3">
      <Card data-testid="tile-used">
        <CardContent className="grid gap-1">
          <span className="text-muted-foreground text-xs">{t("token_usage.report.used_in_period")}</span>
          <span className="text-primary text-xl font-semibold tabular-nums">
            {formatValue(metricValue(current, metric), metric)}
          </span>
          <span className="flex items-center gap-1">
            <Delta
              testId="tile-used-delta"
              delta={percentageDelta(metricValue(current, metric), metricValue(previous, metric))}
              decimal={decimal}
            />
            <span className="text-muted-foreground text-xs">{t("token_usage.report.vs_previous")}</span>
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {balances && (
          <Card data-testid="tile-monthly" size="sm">
            <CardContent className="grid gap-1">
              <span className="text-muted-foreground text-xs">{t("token_usage.report.monthly_left")}</span>
              <span className="flex items-baseline gap-1">
                <span data-testid="tile-monthly-value" className={cn("text-sm font-medium tabular-nums", monthlyColor)}>
                  {whole(balances.availableMonthlyCredits)}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">/ {whole(balances.monthlyCredits)}</span>
              </span>
            </CardContent>
          </Card>
        )}

        {balances && (
          <Card data-testid="tile-extra" size="sm">
            <CardContent className="grid gap-1">
              <span className="text-muted-foreground text-xs">{t("token_usage.report.extra_credits")}</span>
              <span className="text-sm font-medium tabular-nums">{whole(balances.availableExtraCredits)}</span>
            </CardContent>
          </Card>
        )}

        <Card data-testid="tile-calls" size="sm">
          <CardContent className="grid gap-1">
            <span className="text-muted-foreground text-xs">{t("token_usage.report.calls")}</span>
            <span className="text-sm font-medium tabular-nums">{decimal(current.calls, 0)}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * The delta slot. An undefined delta means the previous window was zero: an em
 * dash says "not comparable" where a percentage would say "infinite growth".
 *
 * `decimal` arrives as a prop rather than from the hook because this is a
 * module-level function, not a component — calling a hook here would break the
 * rules of hooks.
 */
function Delta({
  testId,
  delta,
  decimal,
}: {
  testId: string;
  delta: number | undefined;
  decimal: (value: number, decimals: number) => string;
}) {
  if (delta === undefined) {
    return (
      <span data-testid={testId} className="text-muted-foreground text-xs">
        —
      </span>
    );
  }

  const increased = delta >= 0;
  const Icon = increased ? ArrowUpIcon : ArrowDownIcon;

  // On a SPEND page more is not better, so the semantics are inverted relative
  // to the administrative tiles: rising spend reads as a warning, not a success.
  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center gap-0.5 text-xs tabular-nums",
        increased ? "text-warning" : "text-success",
      )}
    >
      <Icon aria-hidden className="size-3" />
      {decimal(Math.abs(delta), 0)} %
    </span>
  );
}
