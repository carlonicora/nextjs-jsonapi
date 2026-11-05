import { ChartNoAxesCombinedIcon } from "lucide-react";
import { ModuleFactory, ModuleWithPermissions } from "../../permissions";
import { AnalyticsBreakdown } from "./data/analytics-breakdown";
import { AnalyticsDailyUniqueTimeline } from "./data/analytics-daily-unique-timeline";
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
    // Never put words ad/tracking blocklists match in this path (analytics, event,
    // track, collect, beacon, pageview, stats, metrics, telemetry): EasyPrivacy's
    // "/analytics/event" rule silently dropped every page view from uBlock Origin users.
    AnalyticsEvent: factory({ name: "wayfinding", model: AnalyticsEvent }),
    AnalyticsSummary: factory({
      name: "analytics/administration/summary",
      model: AnalyticsSummary,
      icon: ChartNoAxesCombinedIcon,
    }),
    AnalyticsTimeline: factory({
      name: "analytics/administration/timeline",
      model: AnalyticsTimeline,
      icon: ChartNoAxesCombinedIcon,
    }),
    AnalyticsDailyUniqueTimeline: factory({
      name: "analytics/administration/daily-uniques",
      model: AnalyticsDailyUniqueTimeline,
      icon: ChartNoAxesCombinedIcon,
    }),
    AnalyticsBreakdown: factory({
      name: "analytics/administration/breakdown",
      model: AnalyticsBreakdown,
      icon: ChartNoAxesCombinedIcon,
    }),
    AnalyticsSession: factory({
      name: "analytics/administration/sessions",
      model: AnalyticsSession,
      icon: ChartNoAxesCombinedIcon,
    }),
    AnalyticsPageView: factory({ name: "pageviews", model: AnalyticsPageView, icon: ChartNoAxesCombinedIcon }),
  }) satisfies Record<string, ModuleWithPermissions>;
