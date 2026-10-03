// Each value list is the single source of its union type: components iterate
// the constant, and the type is derived from it so the two cannot drift.

export const ANALYTICS_SECTIONS = ["all", "public", "app"] as const;
export type AnalyticsSection = (typeof ANALYTICS_SECTIONS)[number];

export const ANALYTICS_GRANULARITIES = ["day", "week", "month"] as const;
export type AnalyticsGranularity = (typeof ANALYTICS_GRANULARITIES)[number];

export const ANALYTICS_DIMENSIONS = ["source", "medium", "campaign", "referrer", "route", "landing"] as const;
export type AnalyticsDimension = (typeof ANALYTICS_DIMENSIONS)[number];

export type AnalyticsFilters = {
  /** ISO 8601 instant. */
  from: string;
  /** ISO 8601 instant. */
  to: string;
  section: AnalyticsSection;
};

/** One page view, as the tracker posts it to `analytics/events`. */
export type AnalyticsEventInput = {
  id: string;
  path: string;
  section: "public" | "app";
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  visitorId?: string;
  screenWidth?: number;
};

// Input types for the read-only models' createJsonApi(). `id` is always
// required — JSON:API resource objects are identified.

export type AnalyticsSummaryInput = {
  id: string;
  section: string;
  window: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  pagesPerSession: number;
  consentShare: number;
};

export type AnalyticsTimelineInput = {
  id: string;
  /** Backend field type is "date" — emitted via formatLocalDate, never raw. */
  bucket: Date;
  section: string;
  visitors: number;
  sessions: number;
  pageViews: number;
};

export type AnalyticsBreakdownInput = {
  id: string;
  dimension: string;
  key: string;
  visitors: number;
  sessions: number;
  pageViews: number;
};

export type AnalyticsSessionInput = {
  id: string;
  visitorId: string;
  consented: boolean;
  /** Backend field type is "datetime" — emitted via toISOString(). */
  startedAt: Date;
  /** Backend field type is "datetime" — emitted via toISOString(). */
  lastSeenAt: Date;
  pageViews: number;
  section: string;
  landingRoute: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  deviceType: string;
  userId?: string;
};

export type AnalyticsPageViewInput = {
  id: string;
  /** Backend field type is "datetime" — emitted via toISOString(). */
  createdAt: Date;
  path: string;
  route: string;
  section: string;
};
