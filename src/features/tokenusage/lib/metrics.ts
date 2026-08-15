import type { Metric } from "../data/tokenusage-admin.types";

/**
 * Locale-free arithmetic for the token-usage surfaces.
 *
 * Everything that turns a number into a STRING lives in `./formatters` instead,
 * because it depends on the request's locale and the app's configured currency.
 * This file stays pure arithmetic so it needs neither.
 */

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

/** Reads the single number a row contributes for the currently selected metric. */
export function metricValue(row: TokenUsageMetrics, metric: Metric): number {
  if (metric === "cost") return row.cost;
  if (metric === "credits") return row.credits;
  return row.tokensIn + row.tokensOut;
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
