"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MicroLabel } from "../../../components";
import { Card, CardContent } from "../../../shadcnui";
import { cn } from "../../../utils";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import { percentageDelta } from "../../tokenusage/lib/metrics";
import type { AnalyticsSummaryInterface } from "../data/analytics-summary.interface";

type Props = {
  /** The six summary rows: {public, app, total} × {current, previous}. */
  summary: AnalyticsSummaryInterface[];
};

type SummaryMetrics = Pick<
  AnalyticsSummaryInterface,
  "visitors" | "sessions" | "pageViews" | "pagesPerSession" | "consentShare"
>;

const ZERO: SummaryMetrics = { visitors: 0, sessions: 0, pageViews: 0, pagesPerSession: 0, consentShare: 0 };

/**
 * The KPI header of the administrative analytics page.
 *
 * Three lead tiles carry the traffic volumes — visitors, sessions, page views —
 * each with its delta against the equal-length preceding window. Two supporting
 * tiles below carry the ratios that give those numbers context.
 *
 * The tiles read the `total` row: the backend already applies the section filter
 * to it, so it is the figure for whatever the filter bar selected. The backend
 * always returns both windows, which is why no tile has to branch on a missing
 * row: an absent one is simply zero-filled here.
 */
export function AnalyticsAdminTiles({ summary }: Props) {
  const t = useTranslations();
  const { decimal } = useUsageFormatters();

  const rowFor = (window: string): SummaryMetrics =>
    summary.find((r) => r.section === "total" && r.window === window) ?? ZERO;

  const current = rowFor("current");
  const previous = rowFor("previous");

  const previousLabel = t("analytics.admin.tiles.vs_previous");

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <LeadTile
          testId="analytics-tile-visitors"
          label={t("analytics.admin.tiles.visitors")}
          value={decimal(current.visitors, 0)}
          delta={percentageDelta(current.visitors, previous.visitors)}
          previousLabel={previousLabel}
          decimal={decimal}
        />
        <LeadTile
          testId="analytics-tile-sessions"
          label={t("analytics.admin.tiles.sessions")}
          value={decimal(current.sessions, 0)}
          delta={percentageDelta(current.sessions, previous.sessions)}
          previousLabel={previousLabel}
          decimal={decimal}
        />
        <LeadTile
          testId="analytics-tile-page-views"
          label={t("analytics.admin.tiles.page_views")}
          value={decimal(current.pageViews, 0)}
          delta={percentageDelta(current.pageViews, previous.pageViews)}
          previousLabel={previousLabel}
          decimal={decimal}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SupportingTile
          testId="analytics-tile-pages-per-session"
          label={t("analytics.admin.tiles.pages_per_session")}
          value={decimal(current.pagesPerSession, 1)}
          delta={percentageDelta(current.pagesPerSession, previous.pagesPerSession)}
          decimal={decimal}
        />
        <SupportingTile
          testId="analytics-tile-consent-share"
          label={t("analytics.admin.tiles.consent_share")}
          // consentShare is a 0..1 ratio on the wire.
          value={`${decimal(current.consentShare * 100, 0)}%`}
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
        <MicroLabel>{label}</MicroLabel>
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
        <MicroLabel>{label}</MicroLabel>
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
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";

  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center gap-0.5 text-xs tabular-nums",
        increased ? "text-success" : "text-destructive",
      )}
    >
      <Icon aria-hidden className="size-3" />
      {`${sign}${decimal(Math.abs(delta), 0)}%`}
    </span>
  );
}
