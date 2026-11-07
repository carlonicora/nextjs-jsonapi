/** A message translator, as returned by `useTranslations()`. */
export type BillingTranslator = (key: string, values?: Record<string, any>) => string;

/**
 * What the billing formatters need from the caller's React context. The
 * formatters are plain functions and cannot call hooks, so a component reads
 * `useI18nLocale()` and `useTranslations()` and passes both here.
 *
 * All are optional so existing callers keep their output: without a `locale`
 * the number formatters use "en-US"; `formatDate` uses `dateLocale`, else
 * `dateFormatLocale(locale)` (the app language, "en" without one); without `t`
 * they return the English literals they always returned.
 */
export type BillingFormatOptions = {
  /** BCP 47 locale for `Intl` (the app's active locale, from `useI18nLocale()`). */
  locale?: string;
  /** BCP 47 locale for dates only (the resolved regional locale, from `useDateFormatter().locale`). Numbers keep `locale`. */
  dateLocale?: string;
  /** Translator for the words the formatters emit. */
  t?: BillingTranslator;
};

/** Number and currency locale when none is given. Dates use `dateFormatLocale` instead. */
export const DEFAULT_BILLING_LOCALE = "en-US";
