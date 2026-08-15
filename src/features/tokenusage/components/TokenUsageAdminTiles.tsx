"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "../../../shadcnui";
import { cn } from "../../../utils";
import type { TokenUsageAdminSummaryInterface } from "../data/tokenusage-admin-summary.interface";
import type { Metric } from "../data/tokenusage-admin.types";
import { useUsageFormatters } from "../lib/formatters";
import { cacheHitPercentage, metricValue, percentageDelta, type TokenUsageMetrics } from "../lib/metrics";

type Props = {
  /** The six summary rows: {customer, platform, total} × {current, previous}. */
  summary: TokenUsageAdminSummaryInterface[];
  metric: Metric;
  /** True when a company filter is applied — platform spend is then meaningless. */
  singleCustomerMode: boolean;
};

const ZERO: TokenUsageMetrics = { cost: 0, credits: 0, tokensIn: 0, tokensOut: 0, cached: 0, calls: 0 };

/**
 * The KPI header of the administrative token-usage page.
 *
 * Two lead tiles carry the cost centres — customer spend and platform spend —
 * each with its delta against the equal-length preceding window. Three
 * supporting tiles below carry the totals that give those two numbers context.
 *
 * The backend always returns both windows, which is why no tile has to branch on
 * a missing row: an absent scope is simply zero-filled here.
 */
export function TokenUsageAdminTiles({ summary, metric, singleCustomerMode }: Props) {
  const t = useTranslations();
  const { decimal, metricValue: formatValue, currency, percent } = useUsageFormatters();

  const rowFor = (scope: string, window: string): TokenUsageMetrics =>
    summary.find((r) => r.scope === scope && r.window === window) ?? ZERO;

  const customerCurrent = rowFor("customer", "current");
  const customerPrevious = rowFor("customer", "previous");
  const platformCurrent = rowFor("platform", "current");
  const platformPrevious = rowFor("platform", "previous");
  const totalCurrent = rowFor("total", "current");
  const totalPrevious = rowFor("total", "previous");

  const averagePerCall = totalCurrent.calls ? totalCurrent.cost / totalCurrent.calls : 0;
  const cacheHit = cacheHitPercentage(totalCurrent.cached, totalCurrent.tokensIn);

  return (
    <div className="grid gap-3">
      <div className={cn("grid gap-3", singleCustomerMode ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
        <LeadTile
          testId="tile-customer"
          label={t("token_usage.admin.customer_spend")}
          value={formatValue(metricValue(customerCurrent, metric), metric)}
          delta={percentageDelta(metricValue(customerCurrent, metric), metricValue(customerPrevious, metric))}
          previousLabel={t("token_usage.admin.vs_previous")}
          decimal={decimal}
        />
        {!singleCustomerMode && (
          <LeadTile
            testId="tile-platform"
            label={t("token_usage.admin.platform_spend")}
            value={formatValue(metricValue(platformCurrent, metric), metric)}
            delta={percentageDelta(metricValue(platformCurrent, metric), metricValue(platformPrevious, metric))}
            previousLabel={t("token_usage.admin.vs_previous")}
            decimal={decimal}
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SupportingTile
          testId="tile-total"
          label={t("token_usage.admin.total_cost")}
          value={formatValue(metricValue(totalCurrent, metric), metric)}
          delta={percentageDelta(metricValue(totalCurrent, metric), metricValue(totalPrevious, metric))}
          decimal={decimal}
        />
        <SupportingTile
          testId="tile-avg-per-call"
          label={t("token_usage.admin.avg_per_call")}
          value={currency(averagePerCall, 4)}
          decimal={decimal}
        />
        <SupportingTile
          testId="tile-cache-hit"
          label={t("token_usage.admin.cache_hit")}
          value={percent(cacheHit)}
          decimal={decimal}
        />
      </div>
    </div>
  );
}

function LeadTile({
  testId,
  label,
  value,
  delta,
  previousLabel,
  decimal,
}: {
  testId: string;
  label: string;
  value: string;
  delta: number | undefined;
  previousLabel: string;
  /** Passed down because `Delta` is a plain function, not a component: it cannot call the hook itself. */
  decimal: (value: number, decimals: number) => string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="grid gap-1">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="text-primary text-xl font-semibold tabular-nums">{value}</span>
        <span className="flex items-center gap-1">
          <Delta testId={`${testId}-delta`} delta={delta} decimal={decimal} />
          <span className="text-muted-foreground text-xs">{previousLabel}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function SupportingTile({
  testId,
  label,
  value,
  delta,
  decimal,
}: {
  testId: string;
  label: string;
  value: string;
  delta?: number | undefined;
  /** Passed down because `Delta` is a plain function, not a component: it cannot call the hook itself. */
  decimal: (value: number, decimals: number) => string;
}) {
  return (
    <Card data-testid={testId} size="sm">
      <CardContent className="grid gap-1">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium tabular-nums">{value}</span>
          {delta !== undefined && <Delta testId={`${testId}-delta`} delta={delta} decimal={decimal} />}
        </span>
      </CardContent>
    </Card>
  );
}

/**
 * The delta slot. An undefined delta means the previous window was zero: an
 * em dash says "not comparable" where a percentage would say "infinite growth".
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

  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center gap-0.5 text-xs tabular-nums",
        increased ? "text-success" : "text-destructive",
      )}
    >
      <Icon aria-hidden className="size-3" />
      {decimal(Math.abs(delta), 0)} %
    </span>
  );
}
