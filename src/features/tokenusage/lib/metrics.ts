import type { Metric } from "../data/tokenusage-admin.types";

/**
 * The metric field set every admin token-usage resource carries. Declared
 * structurally so it accepts the summary, timeline and breakdown interfaces
 * alike — all three expose exactly these getters.
 */
export type TokenUsageMetrics = {
  cost: number;
  credits: number;
  tokensIn: number;
  tokensOut: number;
  cached: number;
  calls: number;
};

/** UI copy is Italian, so every figure is formatted with the Italian locale. */
const LOCALE = "it-IT";

/** Reads the single number a row contributes for the currently selected metric. */
export function metricValue(row: TokenUsageMetrics, metric: Metric): number {
  if (metric === "cost") return row.cost;
  if (metric === "credits") return row.credits;
  return row.tokensIn + row.tokensOut;
}

/** Locale-aware fixed-decimal number, e.g. 9.46 → "9,46". */
export function formatDecimal(value: number, decimals: number): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a metric value for display: euros carry a "€ " prefix and 2 decimals,
 * credits 2 decimals, token counts are whole numbers.
 */
export function formatMetricValue(value: number, metric: Metric): string {
  if (metric === "cost") return `€ ${formatDecimal(value, 2)}`;
  if (metric === "credits") return formatDecimal(value, 2);
  return formatDecimal(value, 0);
}

/** Percentage with one decimal, e.g. 60 → "60,0 %". */
export function formatPercent(value: number, decimals = 1): string {
  return `${formatDecimal(value, decimals)} %`;
}

/**
 * Share of cached input tokens. Returns 0 rather than NaN when the window holds
 * no input tokens at all, so the tile renders "0,0 %" instead of "NaN %".
 */
export function cacheHitPercentage(cached: number, tokensIn: number): number {
  if (!tokensIn) return 0;
  return (cached / tokensIn) * 100;
}

/**
 * Percentage change of `current` against `previous`, rounded to a whole number.
 *
 * Returns `undefined` when the previous window is zero — there is no meaningful
 * percentage change from nothing, and rendering Infinity would be worse than
 * rendering nothing. Callers show an em dash in that slot.
 */
export function percentageDelta(current: number, previous: number): number | undefined {
  if (!previous) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}
