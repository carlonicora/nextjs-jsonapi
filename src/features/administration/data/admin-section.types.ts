import { LucideIcon } from "lucide-react";

/**
 * One row of the administration index: an icon, a translated label and
 * description, and the route it opens.
 *
 * Labels and descriptions are i18n *keys*, never resolved strings, so
 * AdminIndexGrid stays the single place that calls useTranslations().
 * `labelValues` / `descriptionValues` carry ICU arguments — `{ count: 2 }` for
 * the `entities.*` plural keys, or `{ type: "..." }` for an app reusing its own
 * parameterised heading key.
 */
export type AdminSection = {
  /** Stable React key, and the `admin-index-<key>` test id on the rendered link. */
  key: string;
  icon: LucideIcon;
  labelKey: string;
  labelValues?: Record<string, string | number>;
  descriptionKey: string;
  descriptionValues?: Record<string, string | number>;
  href: string;
};

/** A titled block of sections. The built-in "platform" group always renders first. */
export type AdminGroup = {
  key: string;
  labelKey: string;
  labelValues?: Record<string, string | number>;
  sections: AdminSection[];
};
