"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../shadcnui";
import { TokenUsageAdminTimelineInterface } from "../data/tokenusage-admin-timeline.interface";
import { Metric, StackBy } from "../data/tokenusage-admin.types";
import { operationLabel } from "../lib/operation-label";
import { CATEGORICAL_CEILING, ChartMode, OTHER_COLOR, seriesColor } from "../lib/palette";

/** The rollup series every series past the colour ceiling folds into. */
const OTHER_SERIES = "other";

type TokenUsageTimelineChartProps = {
  rows: TokenUsageAdminTimelineInterface[];
  metric: Metric;
  stackBy: StackBy;
  className?: string;
};

type TimelineBucket = { bucket: string } & Record<string, number | string>;

/**
 * The bucket key, derived with UTC getters.
 *
 * The backend field is `type: "date"` — a calendar day with no time — and the
 * model parses the `YYYY-MM-DD` wire value with `new Date(...)`, which lands on
 * UTC midnight. Reading it back with local getters would shift the bucket a day
 * early west of UTC, so the key (and every label built from it) stays in UTC.
 */
const bucketKey = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const metricValue = (row: TokenUsageAdminTimelineInterface, metric: Metric): number => {
  if (metric === "cost") return row.cost;
  if (metric === "credits") return row.credits;
  return row.tokensIn + row.tokensOut;
};

/**
 * The granularity the data was bucketed at, inferred from the spacing between
 * consecutive buckets. The backend chooses the granularity and the rows carry
 * the consequence, so the axis reads it off the data rather than taking a prop
 * that could disagree with what was actually fetched.
 */
const inferGranularity = (buckets: string[]): "day" | "week" | "month" => {
  if (buckets.length < 2) return "day";

  const dayMs = 24 * 60 * 60 * 1000;
  let smallestGap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < buckets.length; i += 1) {
    const gap = (Date.parse(buckets[i]) - Date.parse(buckets[i - 1])) / dayMs;
    if (gap > 0 && gap < smallestGap) smallestGap = gap;
  }

  if (smallestGap >= 28) return "month";
  if (smallestGap >= 7) return "week";
  return "day";
};

const bucketFormatter = (granularity: "day" | "week" | "month"): Intl.DateTimeFormat =>
  granularity === "month"
    ? new Intl.DateTimeFormat("it-IT", { month: "short", year: "numeric", timeZone: "UTC" })
    : new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" });

const compactNumber = new Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Usage over time as a stacked bar chart.
 *
 * Colour does an IDENTITY job here — each stacked segment is a series, not a
 * magnitude — so it draws the fixed categorical order from `../lib/palette` and
 * never generates or cycles a hue: series past the ceiling are summed into a
 * single "other" segment painted in the palette's neutral.
 *
 * The palette's light-mode validator run carries a sub-3:1 contrast WARN on
 * three slots, which obliges a relief channel. That is why the legend and the
 * value-carrying tooltip below are not optional decoration: they are what makes
 * the low-contrast fills readable.
 */
export function TokenUsageTimelineChart({ rows, metric, stackBy, className }: TokenUsageTimelineChartProps) {
  const t = useTranslations();
  const { resolvedTheme } = useTheme();
  const mode: ChartMode = resolvedTheme === "dark" ? "dark" : "light";

  const { chartData, seriesKeys } = useMemo(() => {
    if (rows.length === 0) return { chartData: [] as TimelineBucket[], seriesKeys: [] as string[] };

    // Totals per raw series decide who keeps an identity colour: the biggest
    // seven do, everything else is summed into "other". Ranking by total (not by
    // first appearance) keeps the assignment stable while a filter changes which
    // series are present.
    const totals = new Map<string, number>();
    for (const row of rows) totals.set(row.series, (totals.get(row.series) ?? 0) + metricValue(row, metric));

    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([series]) => series);
    const named = ranked.slice(0, CATEGORICAL_CEILING);
    const folded = new Set(ranked.slice(CATEGORICAL_CEILING));

    const keys = folded.size > 0 ? [...named, OTHER_SERIES] : named;

    const byBucket = new Map<string, TimelineBucket>();
    for (const row of rows) {
      const key = bucketKey(row.bucket);
      let entry = byBucket.get(key);
      if (!entry) {
        entry = { bucket: key };
        for (const series of keys) entry[series] = 0;
        byBucket.set(key, entry);
      }
      const series = folded.has(row.series) ? OTHER_SERIES : row.series;
      entry[series] = (entry[series] as number) + metricValue(row, metric);
    }

    return {
      chartData: [...byBucket.values()].sort((a, b) => a.bucket.localeCompare(b.bucket)),
      seriesKeys: keys,
    };
  }, [rows, metric]);

  const seriesLabel = (series: string): string => {
    if (series === OTHER_SERIES) {
      const key = "token_usage.series.other";
      return t.has(key) ? t(key) : "Altro";
    }
    // Stacking by company makes the series a company NAME, which is data, not
    // vocabulary — it is never looked up. Scope and type keys are vocabulary the
    // consuming app supplies, with the raw key as the fallback.
    if (stackBy === "company") return series;
    return operationLabel(
      series,
      (key) => t(key),
      (key) => t.has(key),
    );
  };

  const chartConfig = useMemo(
    () => Object.fromEntries(seriesKeys.map((series) => [series, { label: seriesLabel(series) }])) as ChartConfig,
    [seriesKeys, stackBy],
  );

  if (chartData.length === 0) {
    const key = "token_usage.timeline.empty";
    return (
      <p className={className ? `text-muted-foreground text-sm ${className}` : "text-muted-foreground text-sm"}>
        {t.has(key) ? t(key) : "Nessun dato nel periodo selezionato"}
      </p>
    );
  }

  const granularity = inferGranularity(chartData.map((entry) => entry.bucket));
  const formatBucket = bucketFormatter(granularity);
  const seriesColorFor = (series: string, index: number) =>
    series === OTHER_SERIES ? OTHER_COLOR : seriesColor(index, mode);

  return (
    <div className={className}>
      {/* The pivot, exposed for assertions and for screen readers that would
          otherwise get nothing from the SVG. */}
      <span className="sr-only" data-testid="timeline-data">
        {JSON.stringify(chartData)}
      </span>
      <span className="sr-only" data-testid="timeline-series">
        {JSON.stringify(seriesKeys)}
      </span>

      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <BarChart accessibilityLayer data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="bucket"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
            tickFormatter={(value: string) => formatBucket.format(new Date(`${value}T00:00:00.000Z`))}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={48}
            tickFormatter={(value: number) => compactNumber.format(value)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => formatBucket.format(new Date(`${String(value)}T00:00:00.000Z`))}
              />
            }
          />
          {seriesKeys.length >= 2 ? <ChartLegend content={<ChartLegendContent />} /> : null}
          {seriesKeys.map((series, index) => (
            <Bar
              key={series}
              dataKey={series}
              stackId="usage"
              maxBarSize={28}
              fill={seriesColorFor(series, index)}
              // A 2px stroke in the surface colour is the gap between stacked
              // segments and between neighbouring bars — the palette's own
              // secondary-encoding channel, not a border.
              stroke="var(--background)"
              strokeWidth={2}
              radius={index === seriesKeys.length - 1 ? [4, 4, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
