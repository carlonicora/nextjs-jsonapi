import { StripePriceInterface } from "../../stripe-price/data/stripe-price.interface";
import { BillingFormatOptions, DEFAULT_BILLING_LOCALE } from "./format-options";

/** English output kept for callers that pass no translator. */
function formatIntervalEnglish(price: StripePriceInterface): string {
  if (price.priceType === "one_time" || !price.recurring) {
    return "one-time";
  }

  const { interval, intervalCount } = price.recurring;

  if (intervalCount === 1) {
    return `/${interval}`;
  }

  // Pluralize the interval for counts > 1
  const pluralInterval =
    interval === "day" ? "days" : interval === "week" ? "weeks" : interval === "month" ? "months" : "years";
  return `/${intervalCount} ${pluralInterval}`;
}

/**
 * Format price recurring interval for display
 * @param price - Stripe price object
 * @param options - `t` translates the interval words; without it the output is English
 * @returns Formatted interval string (e.g., "/month", "/year", "/2 weeks", "one-time")
 */
export function formatInterval(price: StripePriceInterface, options: BillingFormatOptions = {}): string {
  const { t } = options;
  if (!t) return formatIntervalEnglish(price);

  if (price.priceType === "one_time" || !price.recurring) {
    return t("billing.ui.interval.one_time");
  }

  const { interval, intervalCount } = price.recurring;

  if (intervalCount === 1) {
    switch (interval) {
      case "day":
        return t("billing.ui.interval.per_day");
      case "week":
        return t("billing.ui.interval.per_week");
      case "month":
        return t("billing.ui.interval.per_month");
      default:
        return t("billing.ui.interval.per_year");
    }
  }

  switch (interval) {
    case "day":
      return t("billing.ui.interval.per_days", { count: intervalCount });
    case "week":
      return t("billing.ui.interval.per_weeks", { count: intervalCount });
    case "month":
      return t("billing.ui.interval.per_months", { count: intervalCount });
    default:
      return t("billing.ui.interval.per_years", { count: intervalCount });
  }
}

/**
 * Format currency amount from cents to localized currency string
 * @param amount - Amount in cents
 * @param currency - Currency code (e.g., "USD", "EUR", "GBP")
 * @param options - `locale` drives number formatting; defaults to "en-US"
 * @returns Formatted currency string (e.g., "$9.99", "€9,99")
 */
export function formatCurrency(
  amount: number | undefined,
  currency: string,
  options: BillingFormatOptions = {},
): string {
  const { locale } = options;
  // No locale: the historical literal. With one, zero goes through Intl like any amount.
  if (amount === undefined && !locale) return "$0.00";

  // Convert cents to dollars
  const dollars = (amount ?? 0) / 100;

  try {
    return new Intl.NumberFormat(locale ?? DEFAULT_BILLING_LOCALE, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  } catch (error) {
    console.error("Error formatting currency:", error);
    // Fallback if currency code is invalid
    return `$${dollars.toFixed(2)}`;
  }
}

/**
 * `value.toFixed(digits)` with the locale's decimal separator ("12.5" in English,
 * "12,5" in Italian). No grouping, so English output matches `toFixed` exactly.
 */
export function formatFixed(value: number, locale: string | undefined, digits: number): string {
  return new Intl.NumberFormat(locale ?? DEFAULT_BILLING_LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  }).format(value);
}
