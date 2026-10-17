"use client";

import { useCallback } from "react";
import { useI18nTranslations } from "../../i18n/config";

/** The injected `t`, plus next-intl's optional non-throwing `has` probe. */
type Translate = ((key: string, values?: Record<string, unknown>) => string) & {
  has?: (key: string) => boolean;
};

/** Fills `{name}` placeholders in an English fallback. */
function interpolate(text: string, values?: Record<string, unknown>): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

/**
 * Chrome text for the shadcnui primitives (the "Close" behind a dialog's X,
 * the sidebar toggle's label, a multi-select's "Search..."), in the active
 * language.
 *
 * The primitives stay framework-agnostic: they never import next-intl. This
 * reads the `useTranslations` the host app passed to `configureI18n()`, and
 * returns the English `fallback` whenever that cannot produce the text — i18n
 * not configured, the app has no such key, or the lookup throws. An app that
 * never defines the key therefore renders exactly what it rendered before.
 *
 * Every primitive that uses this also takes an explicit label prop; a value
 * passed there always wins over the lookup.
 */
export function useUiText(): (key: string, fallback: string, values?: Record<string, unknown>) => string {
  const t = useI18nTranslations() as Translate;

  return useCallback(
    (key: string, fallback: string, values?: Record<string, unknown>): string => {
      if (typeof t.has === "function" && !t.has(key)) return interpolate(fallback, values);
      try {
        const text = t(key, values);
        // The unconfigured fallback, and next-intl's default for a missing
        // key, both hand back the key path itself.
        if (!text || text === key || text.endsWith(`.${key}`)) return interpolate(fallback, values);
        return text;
      } catch {
        return interpolate(fallback, values);
      }
    },
    [t],
  );
}
