"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../shadcnui";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import type { AnalyticsBreakdownInterface } from "../data/analytics-breakdown.interface";
import { ANALYTICS_ATTRIBUTION_DIMENSIONS, type AnalyticsDimension } from "../data/analytics.types";
import { AnalyticsRankTable } from "./AnalyticsRankTable";

type Props = {
  breakdowns: Record<AnalyticsDimension, AnalyticsBreakdownInterface[]>;
};

/** The key the repository folds the tail past the limit into. */
const OTHER_KEY = "other";

type AttributionDimension = (typeof ANALYTICS_ATTRIBUTION_DIMENSIONS)[number];

/**
 * Attribution breakdowns (Site visitors tab), one tab per attribution dimension.
 * Pages are not here: they have their own page-list cards.
 *
 * Each tab is the same four-column table — key, visitors, sessions, page views —
 * sorted by visitors. Sorting is client-side because the whole ranked set is
 * already in memory, so a round trip would buy nothing. Keys are data, not
 * vocabulary: `(none)` and the routes are rendered as the backend wrote them;
 * only the `other` rollup is translated.
 */
export function AnalyticsBreakdownTable({ breakdowns }: Props) {
  const t = useTranslations();

  const labels: Record<AttributionDimension, string> = {
    source: t("analytics.admin.dimensions.source"),
    medium: t("analytics.admin.dimensions.medium"),
    campaign: t("analytics.admin.dimensions.campaign"),
    referrer: t("analytics.admin.dimensions.referrer"),
  };

  return (
    <Tabs defaultValue={ANALYTICS_ATTRIBUTION_DIMENSIONS[0]}>
      {/* The tabs can be wider than a phone-width card: scroll them sideways there. */}
      <TabsList className="max-md:w-full max-md:justify-start max-md:overflow-x-auto">
        {ANALYTICS_ATTRIBUTION_DIMENSIONS.map((dimension) => (
          <TabsTrigger key={dimension} value={dimension}>
            {labels[dimension]}
          </TabsTrigger>
        ))}
      </TabsList>
      {ANALYTICS_ATTRIBUTION_DIMENSIONS.map((dimension) => (
        <TabsContent key={dimension} value={dimension}>
          <BreakdownRows rows={breakdowns[dimension] ?? []} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function BreakdownRows({ rows }: { rows: AnalyticsBreakdownInterface[] }) {
  const t = useTranslations();
  const { decimal } = useUsageFormatters();

  const sortedRows = useMemo(() => [...rows].sort((a, b) => b.visitors - a.visitors), [rows]);

  if (sortedRows.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("analytics.admin.no_data")}</p>;
  }

  return (
    <AnalyticsRankTable
      columns={[
        { label: t("analytics.admin.columns.key") },
        { label: t("analytics.admin.columns.visitors"), numeric: true },
        { label: t("analytics.admin.columns.sessions"), numeric: true },
        { label: t("analytics.admin.columns.page_views"), numeric: true },
      ]}
      rows={sortedRows.map((row) => ({
        id: row.id,
        testId: `analytics-breakdown-row-${row.id}`,
        cells: [
          row.key === OTHER_KEY ? t("analytics.admin.other") : row.key,
          decimal(row.visitors, 0),
          decimal(row.sessions, 0),
          decimal(row.pageViews, 0),
        ],
      }))}
    />
  );
}
