import { ModuleFactory, ModuleWithPermissions } from "../../permissions";
import { AnalyticsBreakdown } from "./data/analytics-breakdown";
import { AnalyticsEvent } from "./data/analytics-event";
import { AnalyticsPageView } from "./data/analytics-page-view";
import { AnalyticsSession } from "./data/analytics-session";
import { AnalyticsSummary } from "./data/analytics-summary";
import { AnalyticsTimeline } from "./data/analytics-timeline";

/**
 * Every resource behind the analytics tracker and dashboard, as one object a
 * consuming app spreads into its `allModules`. Same rationale as
 * `tokenUsageModules`: one spread cannot be partially done, and a forgotten
 * name is `undefined` at runtime even though `Modules.X` typechecks.
 *
 * `AnalyticsPageView` is only a child segment: the service builds
 * `analytics/administration/sessions/{id}/pageviews` with EndpointCreator's
 * `childEndpoint`. None has a pageUrl — these are not navigable resources.
 *
 * `satisfies` keeps the constraint without widening the return type to an
 * index signature (see tokenusage.modules.ts).
 */
export const analyticsModules = (factory: ModuleFactory) =>
  ({
    AnalyticsEvent: factory({ name: "analytics/events", model: AnalyticsEvent }),
    AnalyticsSummary: factory({ name: "analytics/administration/summary", model: AnalyticsSummary }),
    AnalyticsTimeline: factory({ name: "analytics/administration/timeline", model: AnalyticsTimeline }),
    AnalyticsBreakdown: factory({ name: "analytics/administration/breakdown", model: AnalyticsBreakdown }),
    AnalyticsSession: factory({ name: "analytics/administration/sessions", model: AnalyticsSession }),
    AnalyticsPageView: factory({ name: "pageviews", model: AnalyticsPageView }),
  }) satisfies Record<string, ModuleWithPermissions>;
