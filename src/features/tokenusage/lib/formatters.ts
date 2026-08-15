"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";
import type { Metric } from "../data/tokenusage-admin.types";
import { getTokenUsageCurrency } from "./config";

export type UsageFormatters = {
  /** Locale-aware fixed-decimal number, e.g. 9.46 → "9,46" in it-IT. */
  decimal(value: number, decimals: number): string;
  /** Currency for cost, 2 decimals for credits, whole numbers for tokens. */
  metricValue(value: number, metric: Metric): string;
  /** Currency with an explicit decimal count — the per-call tile needs 4. */
  currency(value: number, decimals: number): string;
  /** Percentage with one decimal by default, e.g. 60 → "60,0 %" in it-IT. */
  percent(value: number, decimals?: number): string;
  /** Compact notation for axis ticks, e.g. 1500000 → "1,5 Mln" in it-IT. */
  compact(value: number): string;
  /** A "YYYY-MM-DD" bucket key rendered as an axis or tooltip label, in UTC. */
  bucketDate(iso: string, granularity: "day" | "week" | "month"): string;
  /** Locale collation for client-side table sorting. */
  compare(a: string, b: string): number;
};

/**
 * Builds every formatter the token-usage surfaces need, for one locale and one
 * currency.
 *
 * A pure factory on purpose: it takes no React context, so the arithmetic and
 * the formatting are unit-testable without rendering, and a server component or
 * a test can construct a set for an arbitrary locale.
 *
 * The currency symbol is placed with a space rather than through
 * `style: "currency"`, which is what the previous hard-coded implementation
 * rendered ("€ 9,46"). Keeping that shape means a consuming app on EUR sees
 * byte-identical output after this refactor.
 *
 * `bucketDate` formats in UTC, always. The wire value is a `type: "date"` — a
 * calendar day — parsed to UTC midnight; reading it back with local getters
 * would shift the label a day early west of UTC.
 */
export function createUsageFormatters(locale: string, currency: string): UsageFormatters {
  const symbol =
    new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency;

  const decimal = (value: number, decimals: number): string =>
    value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const dayFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const monthFormat = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" });
  const compactFormat = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const collator = new Intl.Collator(locale);

  return {
    decimal,

    metricValue(value, metric) {
      if (metric === "cost") return `${symbol} ${decimal(value, 2)}`;
      // Credits are stored to 4 decimals (round4(cost / creditCost)), but that
      // precision is noise to a reader comparing rows: one decimal is enough to
      // separate two values and keeps the columns narrow enough to scan.
      if (metric === "credits") return decimal(value, 1);
      return decimal(value, 0);
    },

    currency(value, decimals) {
      return `${symbol} ${decimal(value, decimals)}`;
    },

    percent(value, decimals = 1) {
      return `${decimal(value, decimals)} %`;
    },

    compact(value) {
      return compactFormat.format(value);
    },

    bucketDate(iso, granularity) {
      const date = new Date(`${iso}T00:00:00.000Z`);
      return granularity === "month" ? monthFormat.format(date) : dayFormat.format(date);
    },

    compare(a, b) {
      return collator.compare(a, b);
    },
  };
}

/**
 * The formatter set for the current request's locale and the app's configured
 * currency. Memoised on both, so the Intl objects are built once per locale
 * rather than on every render.
 */
export function useUsageFormatters(): UsageFormatters {
  const locale = useLocale();
  const currency = getTokenUsageCurrency();
  return useMemo(() => createUsageFormatters(locale, currency), [locale, currency]);
}
