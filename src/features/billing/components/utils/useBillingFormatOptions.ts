import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useDateFormatter } from "../../../../contexts/DateLocaleContext";
import { useI18nLocale } from "../../../../i18n";
import { BillingFormatOptions } from "./format-options";

/**
 * The active locale, the resolved date locale and the translator, ready to pass to the billing
 * formatters. Suspends on the session under a session `DateLocaleProvider` (via
 * `useDateFormatter()`), so its callers sit behind a page `loading.tsx` or their own `<Suspense>`.
 */
export function useBillingFormatOptions(): Required<BillingFormatOptions> {
  const t = useTranslations();
  const locale = useI18nLocale();
  const { locale: dateLocale } = useDateFormatter();
  return useMemo(() => ({ locale, dateLocale, t }), [locale, dateLocale, t]);
}
