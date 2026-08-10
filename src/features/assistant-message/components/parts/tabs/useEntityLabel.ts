"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

/**
 * Turns a JSON:API type (`npcs`, `locations`) into UI copy.
 *
 * The source panels receive wire identifiers, not labels. Host apps translate
 * entity names under `entities.<type>` with a plural count, so prefer that and
 * fall back to the raw type when the app has no such key — the panel must
 * still render for a type the app never localised.
 */
export function useEntityLabel(): (type: string) => string {
  const t = useTranslations();

  return useCallback(
    (type: string): string => {
      const key = `entities.${type}`;
      // `t.has` is the only non-throwing probe: a plain `t()` on a missing key
      // either throws or returns the key path, depending on the host app's
      // next-intl error handler, and the key path reads worse than the type.
      if (typeof t.has === "function" && !t.has(key as never)) return type;
      try {
        // Cast through the untyped call signature: the key is computed, so the
        // generated message-key union cannot describe it, and the `count`
        // parameter is only accepted on keys the union knows about.
        return (t as unknown as (k: string, values?: Record<string, unknown>) => string)(key, { count: 1 });
      } catch {
        return type;
      }
    },
    [t],
  );
}
