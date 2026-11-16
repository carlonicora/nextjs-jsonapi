"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../shadcnui";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import { ChartMode, seriesColor } from "../../tokenusage/lib/palette";
import type { AnalyticsTimelineInterface } from "../data/analytics-timeline.interface";

type DailyUniquesMetric = "visitors" | "users";

type AnalyticsDailyUniquesChartProps = {
  /** Day-granularity timeline rows of the metric's audience; missing days count as 0. */
  rows: AnalyticsTimelineInterface[];
  /** ISO 8601 instant: the first day of the range (UTC). */
  from: string;
  /** ISO 8601 instant: the last day of the range (UTC). */
  to: string;
  /** The audience the rows were counted for: "visitors" or "users". */
  metric: DailyUniquesMetric;
  className?: string;
};

/** One chart entry per calendar day of the range. */
export type DailyUniquesEntry = {
  day: string;
  /** The day's distinct people; 0 for a day with no row. */
  value: number;
  /** The solid line. Null where the dotted segment takes over. */
  line: number | null;
  /** The dotted yesterday-to-today segment; null everywhere else. */
  todayLine: number | null;
  isToday: boolean;
};

/**
 * The palette slot of each metric: visitors keep the "Visitors" colour of the
 * "Over time" chart (slot 0); users skip slot 1, which is page views there.
 */
const METRIC_SLOT: Record<DailyUniquesMetric, number> = { visitors: 0, users: 2 };

/** Dot radius, solid and hollow alike. */
const DOT_RADIUS = 4;

/**
 * The day key, derived with UTC getters — the same helper as
 * `AnalyticsTimelineChart`. The backend field is `type: "date"`, which the model
 * parses to UTC midnight, so local getters would shift it a day west of UTC.
 */
const bucketKey = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** The browser's local calendar day of an instant, as YYYY-MM-DD. */
const localDayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Builds one entry per calendar day from `from` to `to` (the picked local days), and splits them
 * into the solid line and the dotted "today" segment.
 *
 * The rows are the day-granularity timeline: a day with no row had nobody, so
 * it counts 0. `visitors` is the distinct people of the row's audience that day
 * (unique users on the users audience).
 *
 * Today (UTC) is still counting, so when the last day is today the last segment
 * moves to `todayLine` (drawn dotted) and the solid line stops at yesterday.
 */
export function buildDailyUniquesSeries(
  rows: AnalyticsTimelineInterface[],
  from: string,
  to: string,
  todayKey: string,
): DailyUniquesEntry[] {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const day = bucketKey(row.bucket);
    byDay.set(day, (byDay.get(day) ?? 0) + (row.visitors ?? 0));
  }

  // The range ends are the days the admin picked in the browser (local midnight
  // and local end of day), so they are keyed by LOCAL date: a UTC key would turn
  // 11 Nov 00:00 in Rome into 10 Nov and add a day before the pick.
  const start = Date.parse(`${localDayKey(new Date(from))}T00:00:00.000Z`);
  const end = Date.parse(`${localDayKey(new Date(to))}T00:00:00.000Z`);
  const entries: DailyUniquesEntry[] = [];
  if (Number.isFinite(start) && Number.isFinite(end)) {
    for (let time = start; time <= end; time += DAY_MS) {
      const day = bucketKey(new Date(time));
      const value = byDay.get(day) ?? 0;
      entries.push({ day, value, line: value, todayLine: null, isToday: day === todayKey });
    }
  }

  const last = entries.length - 1;
  if (last >= 1 && entries[last].isToday) {
    entries[last - 1].todayLine = entries[last - 1].value;
    entries[last].todayLine = entries[last].value;
    entries[last].line = null;
  }

  return entries;
}

type DotProps = { cx?: number | null; cy?: number | null; index?: number; payload?: DailyUniquesEntry };

/**
 * Unique visitors or unique users per day, as a line.
 *
 * Always daily, whatever the granularity filter says: one point per day of the
 * picked range, a day without data drawn as 0. One series, so no legend — the card title
 * names it. Colour does an identity job (the same metric keeps the same colour
 * as in the "Over time" chart); the tooltip carries the value as text.
 */
export function AnalyticsDailyUniquesChart({ rows, from, to, metric, className }: AnalyticsDailyUniquesChartProps) {
  const t = useTranslations();
  const { compact, bucketDate, decimal } = useUsageFormatters();
  const { resolvedTheme } = useTheme();
  const mode: ChartMode = resolvedTheme === "dark" ? "dark" : "light";
  const color = seriesColor(METRIC_SLOT[metric], mode);

  const chartData = useMemo(() => buildDailyUniquesSeries(rows, from, to, bucketKey(new Date())), [rows, from, to]);

  const points = useMemo(() => chartData.map(({ day, value }) => ({ day, value })), [chartData]);

  const seriesLabel = t(`analytics.admin.daily_uniques.${metric}`);

  const chartConfig = useMemo(() => ({ line: { label: seriesLabel, color } }) as ChartConfig, [seriesLabel, color]);

  if (chartData.length === 0) {
    return (
      <p className={className ? `text-muted-foreground text-xs ${className}` : "text-muted-foreground text-xs"}>
        {t("analytics.admin.no_data")}
      </p>
    );
  }

  /** Small solid dots; today's point is hollow (still counting). */
  const renderDot = ({ cx, cy, index, payload }: DotProps) => {
    if (cx == null || cy == null || !payload) return <g key={`dot-${index}`} />;
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={DOT_RADIUS}
        fill={payload.isToday ? "var(--card)" : color}
        stroke={payload.isToday ? color : "var(--card)"}
        strokeWidth={2}
      />
    );
  };

  /** The dotted segment draws only today's hollow dot; yesterday's is on the solid line. */
  const renderTodayDot = (props: DotProps) =>
    props.payload?.isToday ? renderDot(props) : <g key={`today-dot-${props.index}`} />;

  return (
    // The chart is a coordinate system, not prose: it stays an LTR island.
    // rtl-ok: deliberate LTR island (chart)
    <div className={className} dir="ltr">
      {/* The points, exposed for assertions and for screen readers that would
          otherwise get nothing from the SVG. */}
      <span className="sr-only" data-testid={`analytics-daily-${metric}-data`}>
        {JSON.stringify(points)}
      </span>

      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <LineChart accessibilityLayer data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
            tickFormatter={(value: string) => bucketDate(value, "day")}
          />
          <YAxis
            domain={[0, "auto"]}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={48}
            tickFormatter={(value: number) => compact(value)}
          />
          <ChartTooltip
            // Keep today's null solid-line value in the payload; the formatter reads the row's own value.
            filterNull={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value, payload) => {
                  const entry = payload?.[0]?.payload as DailyUniquesEntry | undefined;
                  return (
                    <>
                      {bucketDate(String(value), "day")}
                      {entry?.isToday && (
                        <div className="text-muted-foreground text-xs">{t("analytics.admin.daily_uniques.today")}</div>
                      )}
                    </>
                  );
                }}
                // The row's own value, not the hovered series': on today's
                // point the solid line is null while the dotted one holds it.
                formatter={(_value, _name, item) => {
                  const entry = item.payload as DailyUniquesEntry;
                  return (
                    <div className="flex flex-1 justify-between gap-4 leading-none">
                      <span className="text-muted-foreground">{seriesLabel}</span>
                      <span className="text-xs tabular-nums text-end">{decimal(entry.value, 0)}</span>
                    </div>
                  );
                }}
              />
            }
          />
          <Line
            dataKey="line"
            type="linear"
            stroke={color}
            strokeWidth={2}
            connectNulls={false}
            dot={renderDot}
            activeDot={{ r: DOT_RADIUS, strokeWidth: 2, stroke: "var(--card)" }}
            isAnimationActive={false}
          />
          <Line
            dataKey="todayLine"
            type="linear"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="2 5"
            connectNulls={false}
            dot={renderTodayDot}
            activeDot={false}
            tooltipType="none"
            legendType="none"
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
