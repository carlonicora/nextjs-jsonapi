/**
 * The i18n namespace under which a consuming app supplies its own vocabulary for
 * token-usage operation types (`summariser`, `massima_extraction`, …).
 *
 * The set of operations is application-specific — the package cannot know that
 * a360ai calls `massima_extraction` "Estrazione Massime" — so the package looks
 * the copy up here and falls back to the raw key when the app has no entry.
 */
export const OPERATION_LABEL_NAMESPACE = "token_usage.types";

/**
 * `snake_case` / `kebab-case` → `camelCase`, the shape the i18n keys use.
 *
 * Shared by every surface that renders an operation type — the timeline chart's
 * series labels and the ranked bar's operation rows — so the two can never
 * disagree about which key a given type maps to.
 */
export const toCamelCase = (value: string): string => {
  const parts = value.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (parts.length === 0) return value;
  return parts
    .map((part, index) =>
      index === 0 ? part.charAt(0).toLowerCase() + part.slice(1) : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");
};

/**
 * Resolves an operation type to its Italian label, falling back to the raw key.
 *
 * `has` is passed rather than the whole translator so this stays a pure function
 * and both callers can share it regardless of how they obtained `t`.
 */
export const operationLabel = (
  type: string,
  translate: (key: string) => string,
  has: (key: string) => boolean,
): string => {
  const key = `${OPERATION_LABEL_NAMESPACE}.${toCamelCase(type)}`;
  return has(key) ? translate(key) : type;
};
