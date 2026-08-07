"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shadcnui";
import { cn } from "../../../utils";
import type { TokenUsageAdminBreakdownInterface } from "../data/tokenusage-admin-breakdown.interface";
import type { Metric } from "../data/tokenusage-admin.types";
import { cacheHitPercentage, formatDecimal, formatMetricValue, formatPercent, metricValue } from "../lib/metrics";

type Props = {
  rows: TokenUsageAdminBreakdownInterface[];
  metric: Metric;
};

type SortKey =
  "label" | "sublabel" | "activeUsers" | "calls" | "tokensIn" | "tokensOut" | "cacheHit" | "cost" | "credits" | "share";

type SortState = { key: SortKey; direction: "asc" | "desc" };

/**
 * The numeric detail behind the ranked bars: every row, every metric column.
 *
 * The bars answer "who is biggest"; this answers "why". Sorting is client-side
 * because the whole ranked set — top-N plus the "other" rollup — is already in
 * memory, so a round trip would buy nothing.
 */
export function TokenUsageBreakdownTable({ rows, metric }: Props) {
  const t = useTranslations();
  const [sort, setSort] = useState<SortState | undefined>(undefined);

  // The company dimension is the only one that reports active users. Rather than
  // render an empty column on user/operation breakdowns, the column disappears.
  const showActiveUsers = rows.some((row) => row.activeUsers !== undefined);

  const total = useMemo(() => rows.reduce((sum, row) => sum + metricValue(row, metric), 0), [rows, metric]);

  const sortValue = (row: TokenUsageAdminBreakdownInterface, key: SortKey): number | string => {
    switch (key) {
      case "label":
        return row.label ?? "";
      case "sublabel":
        return row.sublabel ?? "";
      case "activeUsers":
        return row.activeUsers ?? 0;
      case "cacheHit":
        return cacheHitPercentage(row.cached, row.tokensIn);
      case "share":
        return metricValue(row, metric);
      default:
        return row[key];
    }
  };

  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    const factor = sort.direction === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => {
      const left = sortValue(a, sort.key);
      const right = sortValue(b, sort.key);
      if (typeof left === "string" || typeof right === "string") {
        return String(left).localeCompare(String(right), "it-IT") * factor;
      }
      return (left - right) * factor;
    });
  }, [rows, sort, metric]);

  // First click on a column sorts descending: on a spend table the interesting
  // end of every numeric column is the top one.
  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === "desc" ? "asc" : "desc" }
        : { key, direction: "desc" },
    );

  const columns: { key: SortKey; label: string; numeric: boolean }[] = [
    { key: "label", label: t("token_usage.admin.columns.label"), numeric: false },
    { key: "sublabel", label: t("token_usage.admin.columns.sublabel"), numeric: false },
    ...(showActiveUsers
      ? [{ key: "activeUsers" as const, label: t("token_usage.admin.columns.active_users"), numeric: true }]
      : []),
    { key: "calls", label: t("token_usage.admin.columns.calls"), numeric: true },
    { key: "tokensIn", label: t("token_usage.admin.columns.tokens_in"), numeric: true },
    { key: "tokensOut", label: t("token_usage.admin.columns.tokens_out"), numeric: true },
    // Reuses the tile's key rather than minting a column-specific one — same
    // metric, same words.
    { key: "cacheHit", label: t("token_usage.admin.cache_hit"), numeric: true },
    { key: "cost", label: t("token_usage.admin.columns.cost"), numeric: true },
    { key: "credits", label: t("token_usage.admin.columns.credits"), numeric: true },
    { key: "share", label: t("token_usage.admin.columns.share"), numeric: true },
  ];

  return (
    // The package's <Table> wraps itself in an `overflow-x-clip` container, which
    // would swallow the overflow before this scroller ever saw it — hence the
    // child override. Wide metric tables must scroll, never widen the page.
    <div className="overflow-x-auto [&_[data-slot=table-container]]:overflow-x-visible">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={cn(column.numeric && "text-right")}>
                <button
                  type="button"
                  onClick={() => toggleSort(column.key)}
                  className={cn(
                    "hover:text-primary inline-flex items-center gap-1 text-xs font-medium",
                    column.numeric && "flex-row-reverse",
                  )}
                >
                  {column.label}
                  {sort?.key === column.key &&
                    (sort.direction === "desc" ? (
                      <ArrowDownIcon aria-hidden className="size-3" />
                    ) : (
                      <ArrowUpIcon aria-hidden className="size-3" />
                    ))}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => {
            const value = metricValue(row, metric);
            const share = total > 0 ? (value / total) * 100 : 0;

            return (
              <TableRow key={row.id} data-testid={`breakdown-row-${row.id}`}>
                <TableCell className="text-xs">
                  {row.id === "other" ? t("token_usage.admin.other") : row.label}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{row.sublabel ?? ""}</TableCell>
                {showActiveUsers && (
                  <TableCell className="text-right text-xs tabular-nums">
                    {row.activeUsers === undefined ? "" : formatDecimal(row.activeUsers, 0)}
                  </TableCell>
                )}
                <TableCell className="text-right text-xs tabular-nums">{formatDecimal(row.calls, 0)}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{formatDecimal(row.tokensIn, 0)}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{formatDecimal(row.tokensOut, 0)}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatPercent(cacheHitPercentage(row.cached, row.tokensIn))}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">{formatMetricValue(row.cost, "cost")}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatMetricValue(row.credits, "credits")}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">{formatPercent(share)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
