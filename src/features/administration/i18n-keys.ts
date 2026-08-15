/**
 * The fixed namespace of i18n keys the administration index reads via
 * useTranslations. Consuming apps must define each entry in their
 * messages/<locale>.json — this list is the contract between the package and
 * the app, and the names are frozen: an app that wants different wording
 * changes its own translation, never the key.
 *
 * Section LABELS are deliberately absent: they reuse keys every NJA app already
 * defines — `entities.companies`, `entities.users`, `entities.rbac` (all with
 * `{ count: 2 }`), `token_usage.admin.title`, and
 * `billing.admin.products.title` — so section names stay in each app's own
 * vocabulary.
 *
 * Mirrors the contract shipped by the token-usage feature
 * (features/tokenusage/i18n-keys.ts).
 */
export const ADMINISTRATION_I18N_KEYS = [
  "administration.title",
  "administration.subtitle",
  "administration.group.platform",
  "administration.companies.description",
  "administration.users.description",
  "administration.token_usage.description",
  "administration.rbac.description",
  "administration.billing.description",
] as const;
