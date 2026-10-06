"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../shadcnui";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import type { AnalyticsBreakdownInterface } from "../data/analytics-breakdown.interface";
import { ANALYTICS_DIMENSIONS, type AnalyticsDimension } from "../data/analytics.types";

type Props = {
  breakdowns: Record<AnalyticsDimension, AnalyticsBreakdownInterface[]>;
};

/** The key the repository folds the tail past the limit into. */
const OTHER_KEY = "other";

/**
 * Attribution and content breakdowns, one tab per dimension.
 *
 * Each tab is the same four-column table — key, visitors, sessions, page views —
 * sorted by visitors. Sorting is client-side because the whole ranked set is
 * already in memory, so a round trip would buy nothing. Keys are data, not
 * vocabulary: `(none)` and the routes are rendered as the backend wrote them;
 * only the `other` rollup is translated.
 */
export function AnalyticsBreakdownTable({ breakdowns }: Props) {
  const t = useTranslations();

  const labels: Record<AnalyticsDimension, string> = {
    source: t("analytics.admin.dimensions.source"),
    medium: t("analytics.admin.dimensions.medium"),
    campaign: t("analytics.admin.dimensions.campaign"),
    referrer: t("analytics.admin.dimensions.referrer"),
    route: t("analytics.admin.dimensions.route"),
    landing: t("analytics.admin.dimensions.landing"),
  };

  return (
    <Tabs defaultValue={ANALYTICS_DIMENSIONS[0]}>
      {/* Six tabs are wider than a phone-width card: scroll them sideways there. */}
      <TabsList className="max-md:w-full max-md:justify-start max-md:overflow-x-auto">
        {ANALYTICS_DIMENSIONS.map((dimension) => (
          <TabsTrigger key={dimension} value={dimension}>
            {labels[dimension]}
          </TabsTrigger>
        ))}
      </TabsList>
      {ANALYTICS_DIMENSIONS.map((dimension) => (
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
    // The package's <Table> wraps itself in an `overflow-x-clip` container, which
    // would swallow the overflow before this scroller ever saw it — hence the
    // child override. Wide tables must scroll, never widen the page.
    <div className="overflow-x-auto [&_[data-slot=table-container]]:overflow-x-visible">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-medium">{t("analytics.admin.columns.key")}</TableHead>
            <TableHead className="text-end text-xs font-medium">{t("analytics.admin.columns.visitors")}</TableHead>
            <TableHead className="text-end text-xs font-medium">{t("analytics.admin.columns.sessions")}</TableHead>
            <TableHead className="text-end text-xs font-medium">{t("analytics.admin.columns.page_views")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => (
            <TableRow key={row.id} data-testid={`analytics-breakdown-row-${row.id}`}>
              <TableCell className="text-xs">{row.key === OTHER_KEY ? t("analytics.admin.other") : row.key}</TableCell>
              <TableCell className="text-end text-xs tabular-nums">{decimal(row.visitors, 0)}</TableCell>
              <TableCell className="text-end text-xs tabular-nums">{decimal(row.sessions, 0)}</TableCell>
              <TableCell className="text-end text-xs tabular-nums">{decimal(row.pageViews, 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
