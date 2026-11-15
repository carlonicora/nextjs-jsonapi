"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shadcnui";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import type { AnalyticsBreakdownInterface } from "../data/analytics-breakdown.interface";
import { AnalyticsRankTable, type AnalyticsRankTableColumn } from "./AnalyticsRankTable";

export type AnalyticsPageListVariant = "top-pages" | "entry-pages" | "exit-pages" | "most-used-pages";

type Props = {
  variant: AnalyticsPageListVariant;
  title: string;
  rows: AnalyticsBreakdownInterface[];
  /** Current-window sessions of the audience: the denominator of the exit share (exit-pages only). */
  totalSessions?: number;
};

/** The key the repository folds the tail past the limit into. */
const OTHER_KEY = "other";
const MAX_ROWS = 10;

/**
 * One ranked list of pages: most viewed, entry, exit (Site visitors) or most
 * used (App users). The server already ranks the rows, so they render in the
 * order received; the folded `other` tail is dropped, since a page list names
 * pages.
 */
export function AnalyticsPageListCard({ variant, title, rows, totalSessions }: Props) {
  const t = useTranslations();
  const { decimal } = useUsageFormatters();

  const visibleRows = rows.filter((row) => row.key !== OTHER_KEY).slice(0, MAX_ROWS);

  const pageColumn: AnalyticsRankTableColumn = { label: t("analytics.admin.columns.page") };
  const columns: Record<AnalyticsPageListVariant, AnalyticsRankTableColumn[]> = {
    "top-pages": [
      pageColumn,
      { label: t("analytics.admin.columns.page_views"), numeric: true },
      { label: t("analytics.admin.columns.visitors"), numeric: true },
    ],
    "most-used-pages": [
      pageColumn,
      { label: t("analytics.admin.columns.page_views"), numeric: true },
      { label: t("analytics.admin.columns.users"), numeric: true },
    ],
    "entry-pages": [
      pageColumn,
      { label: t("analytics.admin.columns.sessions"), numeric: true },
      { label: t("analytics.admin.tiles.pages_per_session"), numeric: true },
    ],
    "exit-pages": [
      pageColumn,
      { label: t("analytics.admin.columns.exits"), numeric: true },
      { label: t("analytics.admin.columns.exit_share"), numeric: true },
    ],
  };

  const cellsFor = (row: AnalyticsBreakdownInterface) => {
    switch (variant) {
      case "top-pages":
      case "most-used-pages":
        return [row.key, decimal(row.pageViews, 0), decimal(row.visitors, 0)];
      case "entry-pages":
        return [row.key, decimal(row.sessions, 0), row.sessions === 0 ? "0" : decimal(row.pageViews / row.sessions, 1)];
      case "exit-pages":
        return [
          row.key,
          decimal(row.sessions, 0),
          totalSessions ? `${decimal((row.sessions / totalSessions) * 100, 0)}%` : "—",
        ];
      default: {
        const unreachable: never = variant;
        return unreachable;
      }
    }
  };

  return (
    <Card data-testid={`analytics-page-list-${variant}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {visibleRows.length === 0 ? (
          <p className="text-muted-foreground text-xs">{t("analytics.admin.no_data")}</p>
        ) : (
          <AnalyticsRankTable
            columns={columns[variant]}
            rows={visibleRows.map((row) => ({
              id: row.id,
              testId: `analytics-page-list-${variant}-row-${row.id}`,
              cells: cellsFor(row),
            }))}
          />
        )}
      </CardContent>
    </Card>
  );
}
