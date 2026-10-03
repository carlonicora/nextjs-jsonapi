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
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import { ChartMode, seriesColor } from "../../tokenusage/lib/palette";
import { AnalyticsTimelineInterface } from "../data/analytics-timeline.interface";

/** The two fixed series, in palette order: slot 0 visitors, slot 1 page views. */
const SERIES = ["visitors", "pageViews"] as const;

type AnalyticsTimelineChartProps = {
  rows: AnalyticsTimelineInterface[];
  className?: string;
};

type TimelineBucket = { bucket: string; visitors: number; pageViews: number };

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

/**
 * Traffic over time as a grouped bar chart: visitors and page views per bucket.
 *
 * The backend returns one row per bucket per section; the chart sums the
 * sections into one entry per bucket. The two series measure different things,
 * so they sit side by side rather than stacked.
 *
 * Colour does an IDENTITY job here — each bar is a series, not a magnitude — so
 * it draws the fixed categorical order from the token-usage palette (slots 0 and
 * 1). The palette's light-mode validator run carries a sub-3:1 contrast WARN,
 * which obliges a relief channel: the legend and the value-carrying tooltip
 * below are what make the fills readable.
 */
export function AnalyticsTimelineChart({ rows, className }: AnalyticsTimelineChartProps) {
  const t = useTranslations();
  const { compact, bucketDate, decimal } = useUsageFormatters();
  const { resolvedTheme } = useTheme();
  const mode: ChartMode = resolvedTheme === "dark" ? "dark" : "light";

  const chartData = useMemo(() => {
    const byBucket = new Map<string, TimelineBucket>();
    for (const row of rows) {
      const key = bucketKey(row.bucket);
      let entry = byBucket.get(key);
      if (!entry) {
        entry = { bucket: key, visitors: 0, pageViews: 0 };
        byBucket.set(key, entry);
      }
      entry.visitors += row.visitors;
      entry.pageViews += row.pageViews;
    }
    return [...byBucket.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
  }, [rows]);

  const chartConfig = useMemo(
    () =>
      ({
        visitors: { label: t("analytics.admin.series.visitors") },
        pageViews: { label: t("analytics.admin.series.page_views") },
      }) as ChartConfig,
    [t],
  );

  if (chartData.length === 0) {
    return (
      <p className={className ? `text-muted-foreground text-sm ${className}` : "text-muted-foreground text-sm"}>
        {t("analytics.admin.no_data")}
      </p>
    );
  }

  const granularity = inferGranularity(chartData.map((entry) => entry.bucket));

  return (
    // The chart is a coordinate system, not prose: recharts lays the axes and the
    // bars out left-to-right, so the whole chart stays an LTR island even under
    // dir="rtl". Only the labels inside it are translated.
    // rtl-ok: deliberate LTR island (chart)
    <div className={className} dir="ltr">
      {/* The pivot, exposed for assertions and for screen readers that would
          otherwise get nothing from the SVG. */}
      <span className="sr-only" data-testid="analytics-timeline-data">
        {JSON.stringify(chartData)}
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
            tickFormatter={(value: string) => bucketDate(value, granularity)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={48}
            tickFormatter={(value: number) => compact(value)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => bucketDate(String(value), granularity)}
                valueFormatter={(value) => decimal(Number(value), 0)}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {SERIES.map((series, index) => (
            <Bar
              key={series}
              dataKey={series}
              maxBarSize={28}
              fill={seriesColor(index, mode)}
              // A 2px stroke in the surface colour is the gap between
              // neighbouring bars — the palette's own secondary-encoding
              // channel, not a border.
              stroke="var(--background)"
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
