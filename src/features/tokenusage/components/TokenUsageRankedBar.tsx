"use client";

import { useTranslations } from "next-intl";
import type { Metric } from "../data/tokenusage-admin.types";
import { useUsageFormatters } from "../lib/formatters";
import { metricValue, type TokenUsageMetrics } from "../lib/metrics";
import { operationLabel } from "../lib/operation-label";
import { SEQUENTIAL_RAMP } from "../lib/palette";

/**
 * Everything this component actually reads from a row.
 *
 * Declared STRUCTURALLY rather than as one of the breakdown interfaces on
 * purpose: the same list ranks administrative rows (which additionally carry
 * activeUsers / monthlyCredits / availableMonthlyCredits) and self-service
 * report rows (which do not). Narrowing this to the administrative interface
 * would force every self-service caller into a cast, and duplicating the
 * component would fork the ramp and the share arithmetic.
 */
export type TokenUsageRankedRow = TokenUsageMetrics & {
  /** Row identity; the literal "other" marks the folded tail. */
  id: string;
  label: string;
};

type Props = {
  /** Ranked rows, already ordered descending by the backend, "other" last. */
  rows: TokenUsageRankedRow[];
  metric: Metric;
  /** Copy shown when there is nothing to rank, already translated by the caller. */
  emptyLabel: string;
  /**
   * Whether `row.label` is an operation TYPE (vocabulary the consuming app
   * translates) rather than an entity NAME (data, rendered verbatim).
   *
   * Company and user rows carry names — translating them would be nonsense — so
   * this defaults to false and only the platform-by-operation panel opts in.
   */
  labelsAreOperationTypes?: boolean;
};

/**
 * A ranked horizontal bar list — "who spent the most".
 *
 * This does a MAGNITUDE job, not a categorical one, so colour comes from a
 * single sequential ramp indexed by RANK POSITION, never from a categorical
 * palette keyed by entity. That is deliberate: a filter change reorders the
 * rows, and rank-indexed colour simply re-shades them instead of repainting a
 * company into another company's identity hue.
 *
 * There is exactly one series, so there is no legend: every bar is
 * direct-labelled with its value and its share of the total.
 */
export function TokenUsageRankedBar({ rows, metric, emptyLabel, labelsAreOperationTypes = false }: Props) {
  const t = useTranslations();
  const { metricValue: formatValue, percent } = useUsageFormatters();

  const renderLabel = (row: TokenUsageRankedRow): string => {
    if (row.id === "other") return t("token_usage.admin.other");
    if (!labelsAreOperationTypes) return row.label;
    return operationLabel(
      row.label,
      (key) => t(key),
      (key) => t.has(key),
    );
  };

  if (rows.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{emptyLabel}</p>;
  }

  const values = rows.map((row) => metricValue(row, metric));
  const total = values.reduce((sum, value) => sum + value, 0);
  const max = Math.max(...values, 0);

  return (
    <div className="grid gap-0.5">
      {rows.map((row, index) => {
        const value = values[index];
        // The backend folds everything past the limit into one "other" row; it
        // gets the most recessive ramp step so it never out-shouts a real entity.
        const isOther = row.id === "other";
        const step = isOther ? SEQUENTIAL_RAMP.length - 1 : Math.min(index, SEQUENTIAL_RAMP.length - 1);
        const width = max > 0 ? (value / max) * 100 : 0;
        // Shares are taken against the supplied rows, which already include
        // "other" — so the column sums to 100 %.
        const share = total > 0 ? (value / total) * 100 : 0;

        return (
          <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-0.5 py-0.5">
            <div className="grid min-w-0 gap-0.5">
              <span className="text-muted-foreground truncate text-xs">{renderLabel(row)}</span>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-r-[4px]">
                <div
                  data-testid={`ranked-fill-${row.id}`}
                  data-ramp-step={String(step)}
                  className="h-full rounded-r-[4px]"
                  style={{ width: `${width}%`, backgroundColor: SEQUENTIAL_RAMP[step] }}
                />
              </div>
            </div>
            <span data-testid={`ranked-value-${row.id}`} className="text-right text-xs tabular-nums">
              {formatValue(value, metric)}
            </span>
            <span
              data-testid={`ranked-share-${row.id}`}
              className="text-muted-foreground w-16 text-right text-xs tabular-nums"
            >
              {percent(share)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
