// Server-safe public barrel for the analytics feature.
// Consumed via `@carlonicora/nextjs-jsonapi/analytics/server`. Must NOT receive a
// "use client" directive — these are async server components that read the
// session cookie before rendering the client containers from
// `@carlonicora/nextjs-jsonapi/analytics`.

export { AnalyticsAdminPage } from "./components/server/AnalyticsAdminPage";
export { AnalyticsJourneyPage } from "./components/server/AnalyticsJourneyPage";
