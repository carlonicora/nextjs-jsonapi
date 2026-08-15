/**
 * The fixed namespace of i18n keys the administrative token-usage feature reads
 * via useTranslations/getTranslations. Consuming apps must define each entry in
 * their messages/<locale>.json — this list is the contract between the package
 * and the app.
 *
 * One key is NOT listed because it is resolved from data rather than from a
 * fixed string: the timeline chart labels each series through
 * `token_usage.types.<camelCase>` and falls back to the raw series key when the
 * app has no entry, so that namespace stays the app's own vocabulary.
 */
export const TOKEN_USAGE_ADMIN_I18N_KEYS = [
  // Page + KPI tiles
  "token_usage.admin.title",
  "token_usage.admin.customer_spend",
  "token_usage.admin.platform_spend",
  "token_usage.admin.total_cost",
  "token_usage.admin.avg_per_call",
  "token_usage.admin.cache_hit",
  "token_usage.admin.vs_previous",

  // Panel titles
  "token_usage.admin.usage_over_time",
  "token_usage.admin.by_company",
  "token_usage.admin.by_user",
  "token_usage.admin.customer_by_operation",
  "token_usage.admin.platform_by_operation",
  "token_usage.admin.detail",

  // Shared states
  "token_usage.admin.other",
  "token_usage.admin.no_data",

  // Filter bar
  "token_usage.admin.all_companies",
  "token_usage.admin.granularity.label",
  "token_usage.admin.granularity.day",
  "token_usage.admin.granularity.week",
  "token_usage.admin.granularity.month",
  "token_usage.admin.metric.label",
  "token_usage.admin.metric.cost",
  "token_usage.admin.metric.credits",
  "token_usage.admin.metric.tokens",

  // Timeline stacking control
  "token_usage.admin.stack_by",
  "token_usage.admin.stack.scope",
  "token_usage.admin.stack.type",
  "token_usage.admin.stack.company",

  // Breakdown table columns
  "token_usage.admin.columns.label",
  "token_usage.admin.columns.sublabel",
  "token_usage.admin.columns.calls",
  "token_usage.admin.columns.tokens_in",
  "token_usage.admin.columns.tokens_out",
  "token_usage.admin.columns.cost",
  "token_usage.admin.columns.credits",
  "token_usage.admin.columns.share",
  "token_usage.admin.columns.active_users",

  // Timeline chart
  "token_usage.series.other",
  "token_usage.timeline.empty",
] as const;

/**
 * The fixed namespace of i18n keys the self-service token-usage feature reads.
 * Consuming apps must define each entry in their messages/<locale>.json — this
 * list is the contract between the package and the app.
 *
 * The target panel's title is NOT listed: its key is supplied per app through
 * the provider's `targetPanelTitleKey`, because what usage is attributed to is
 * application-specific. Operation labels resolve through
 * `token_usage.types.<camelCase>` with the raw key as fallback, so that
 * namespace stays the app's own vocabulary.
 */
export const TOKEN_USAGE_REPORT_I18N_KEYS = [
  // Page + KPI tiles
  "token_usage.report.title",
  "token_usage.report.used_in_period",
  "token_usage.report.vs_previous",
  "token_usage.report.monthly_left",
  "token_usage.report.extra_credits",
  "token_usage.report.calls",

  // Panel titles
  "token_usage.report.usage_over_time",
  "token_usage.report.by_operation",

  // Shared states
  "token_usage.report.no_data",
] as const;
