// Client-only public barrel for the first-party analytics feature.
// Consumed via `@carlonicora/nextjs-jsonapi/analytics`. Tsup adds a top-level
// "use client" directive to the bundled output via clientEntries.
//
// Deliberately NOT re-exported from `src/index.ts` — keeping the feature off the
// main barrel is what keeps its chart (recharts) out of the main client bundle,
// exactly as the `help` and `tokenusage` features do.
//
// The feature is inert until the app mounts `AnalyticsTracker` and registers
// `analyticsModules` in its bootstrapper.

export { AnalyticsTracker } from "./components/AnalyticsTracker";

export { AnalyticsAdminProvider, useAnalyticsAdmin } from "./contexts/AnalyticsAdminContext";
export type { AnalyticsAdminContextType, AnalyticsAdminFilterState } from "./contexts/AnalyticsAdminContext";

export { AnalyticsAdminContainer } from "./components/AnalyticsAdminContainer";
export { AnalyticsAdminFilterBar } from "./components/AnalyticsAdminFilterBar";
export { AnalyticsAdminTiles } from "./components/AnalyticsAdminTiles";
export { AnalyticsTimelineChart } from "./components/AnalyticsTimelineChart";
export { AnalyticsBreakdownTable } from "./components/AnalyticsBreakdownTable";
export { AnalyticsSessionsTable } from "./components/AnalyticsSessionsTable";
export { AnalyticsJourneyContainer } from "./components/AnalyticsJourneyContainer";
export { AnalyticsAdminPageContainer } from "./components/AnalyticsAdminPageContainer";
export { AnalyticsJourneyPageContainer } from "./components/AnalyticsJourneyPageContainer";

export * from "./data";

export { analyticsModules } from "./analytics.modules";

export { ANALYTICS_ADMIN_I18N_KEYS } from "./i18n-keys";
