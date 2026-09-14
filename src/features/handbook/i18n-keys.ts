/**
 * The fixed namespace of i18n keys the handbook feature reads via
 * useTranslations. Consuming apps must define each entry in their
 * messages/<locale>.json — this list is the contract between the package and
 * the app, and the names are frozen: an app that wants different wording
 * changes its own translation, never the key.
 *
 * Mirrors the contract shipped by the administration feature
 * (features/administration/i18n-keys.ts).
 */
export const handbookI18nKeys = [
  "handbook.title",
  "handbook.subtitle",
  "handbook.sync",
  "handbook.syncing",
  "handbook.synced",
  "handbook.syncFailed",
  "handbook.empty",
  "handbook.notConfigured",
  "handbook.notFound",
  "handbook.chat.title",
  "handbook.chat.placeholder",
  "handbook.chat.ask",
  "handbook.chat.pending",
  "handbook.chat.failed",
  "handbook.chat.sources",
  "handbook.chat.list_title",
  "handbook.chat.new",
  "handbook.chat.empty_sidebar",
  "handbook.chat.rename_placeholder",
  "handbook.chat.delete_confirm",
  "handbook.chat.empty_state.title",
  "handbook.chat.empty_state.subtitle",
  "handbook.contents.title",
  "handbook.contents.status",
  "handbook.contents.failures",
  "handbook.reader.contents",
  "handbook.reader.onThisPage",
  "handbook.reader.previous",
  "handbook.reader.next",
  "handbook.ask.open",
  "handbook.ask.recent",
  "handbook.ask.all",
  "handbook.ask.expand",
  "handbook.ask.thisPageOnly",
  "handbook.sections.untitled",
] as const;
