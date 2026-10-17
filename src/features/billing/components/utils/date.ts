import { BillingFormatOptions, DEFAULT_BILLING_LOCALE } from "./format-options";

/**
 * Format a date to a localized date string
 * @param date - Date object or ISO string
 * @param options - `locale` drives the date format (default "en-US"); `t` translates the
 *   placeholder shown for a missing or invalid date (default English)
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export function formatDate(date: Date | string | undefined, options: BillingFormatOptions = {}): string {
  const { locale, t } = options;
  if (!date) return t ? t("billing.ui.not_available") : "N/A";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  try {
    return new Intl.DateTimeFormat(locale ?? DEFAULT_BILLING_LOCALE, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return t ? t("billing.ui.invalid_date") : "Invalid Date";
  }
}
