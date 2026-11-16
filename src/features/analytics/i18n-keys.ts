/**
 * The fixed namespace of i18n keys the administrative analytics feature reads
 * via useTranslations. Consuming apps must define each entry in their
 * messages/<locale>.json — this list is the contract between the package and
 * the app.
 *
 * The description key is read by the consuming app's page metadata only, not by
 * a component in this package, which is why the contract spec lists it among
 * the keys declared for app-rendered surfaces.
 */
export const ANALYTICS_ADMIN_I18N_KEYS = [
  // Page
  "analytics.admin.title",
  "analytics.admin.description",

  // KPI tiles
  "analytics.admin.tiles.visitors",
  "analytics.admin.tiles.sessions",
  "analytics.admin.tiles.page_views",
  "analytics.admin.tiles.pages_per_session",
  "analytics.admin.tiles.consent_share",
  "analytics.admin.tiles.vs_previous",
  "analytics.admin.tiles.summarised_note",
  "analytics.admin.tiles.users",

  // Tabs
  "analytics.admin.tabs.visitors",
  "analytics.admin.tabs.users",

  // Filter bar
  "analytics.admin.filter.granularity",
  "analytics.admin.filter.granularity_day",
  "analytics.admin.filter.granularity_week",
  "analytics.admin.filter.granularity_month",

  // Panel titles
  "analytics.admin.panels.over_time",
  "analytics.admin.panels.breakdown",
  "analytics.admin.panels.sessions",
  "analytics.admin.panels.journey",
  "analytics.admin.panels.other_sessions",
  "analytics.admin.panels.daily_visitors",
  "analytics.admin.panels.daily_users",

  // Page lists
  "analytics.admin.panels.top_pages",
  "analytics.admin.panels.entry_pages",
  "analytics.admin.panels.exit_pages",
  "analytics.admin.panels.most_used_pages",

  // Breakdown tabs
  "analytics.admin.dimensions.source",
  "analytics.admin.dimensions.medium",
  "analytics.admin.dimensions.campaign",
  "analytics.admin.dimensions.referrer",

  // Table columns
  "analytics.admin.columns.key",
  "analytics.admin.columns.visitors",
  "analytics.admin.columns.sessions",
  "analytics.admin.columns.page_views",
  "analytics.admin.columns.started",
  "analytics.admin.columns.visitor",
  "analytics.admin.columns.source",
  "analytics.admin.columns.landing",
  "analytics.admin.columns.pages",
  "analytics.admin.columns.device",
  "analytics.admin.columns.time",
  "analytics.admin.columns.gap",
  "analytics.admin.columns.path",
  "analytics.admin.columns.page",
  "analytics.admin.columns.exits",
  "analytics.admin.columns.exit_share",
  "analytics.admin.columns.users",

  // Shared states and markers
  "analytics.admin.anonymous",
  "analytics.admin.consented",
  "analytics.admin.not_consented",
  "analytics.admin.load_more",
  "analytics.admin.no_data",
  "analytics.admin.other",

  // Timeline chart series
  "analytics.admin.series.visitors",
  "analytics.admin.series.page_views",
  "analytics.admin.series.users",

  // Daily uniques charts
  "analytics.admin.daily_uniques.visitors",
  "analytics.admin.daily_uniques.users",
  "analytics.admin.daily_uniques.today",
] as const;
