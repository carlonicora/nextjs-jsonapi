import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useI18nLocale } from "../../../../i18n";
import { BillingFormatOptions } from "./format-options";

/** The active locale and translator, ready to pass to the billing formatters. */
export function useBillingFormatOptions(): Required<BillingFormatOptions> {
  const t = useTranslations();
  const locale = useI18nLocale();
  return useMemo(() => ({ locale, t }), [locale, t]);
}
