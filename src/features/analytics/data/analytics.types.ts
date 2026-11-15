// Each value list is the single source of its union type: components iterate
// the constant, and the type is derived from it so the two cannot drift.

export const ANALYTICS_AUDIENCES = ["visitors", "users"] as const;
export type AnalyticsAudience = (typeof ANALYTICS_AUDIENCES)[number];

export const ANALYTICS_GRANULARITIES = ["day", "week", "month"] as const;
export type AnalyticsGranularity = (typeof ANALYTICS_GRANULARITIES)[number];

export const ANALYTICS_DIMENSIONS = ["source", "medium", "campaign", "referrer", "route", "landing", "exit"] as const;
export type AnalyticsDimension = (typeof ANALYTICS_DIMENSIONS)[number];

/** The Breakdown card's tabs (visitors tab only). */
export const ANALYTICS_ATTRIBUTION_DIMENSIONS = ["source", "medium", "campaign", "referrer"] as const;

/** What each tab fetches from the breakdown endpoint, in this order. */
export const ANALYTICS_AUDIENCE_BREAKDOWNS: Record<
  AnalyticsAudience,
  readonly { dimension: AnalyticsDimension; limit: number }[]
> = {
  visitors: [
    { dimension: "source", limit: 20 },
    { dimension: "medium", limit: 20 },
    { dimension: "campaign", limit: 20 },
    { dimension: "referrer", limit: 20 },
    { dimension: "route", limit: 10 },
    { dimension: "landing", limit: 10 },
    { dimension: "exit", limit: 10 },
  ],
  users: [{ dimension: "route", limit: 10 }],
};

export type AnalyticsFilters = {
  /** ISO 8601 instant. */
  from: string;
  /** ISO 8601 instant. */
  to: string;
  /** Omitted only by the journey page's per-visitor lookup (both audiences). */
  audience?: AnalyticsAudience;
};

/** One page view, as the tracker posts it to `wayfinding`. */
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
  /** True only on the event sent by the Accept click: the API adopts the open cookieless session. */
  consentGranted?: boolean;
};

// Input types for the read-only models' createJsonApi(). `id` is always
// required — JSON:API resource objects are identified.

export type AnalyticsSummaryInput = {
  id: string;
  section: "total";
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
  section: AnalyticsAudience;
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
