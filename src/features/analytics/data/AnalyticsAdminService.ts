import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import { AnalyticsBreakdownInterface } from "./analytics-breakdown.interface";
import { AnalyticsPageViewInterface } from "./analytics-page-view.interface";
import { AnalyticsSessionInterface } from "./analytics-session.interface";
import { AnalyticsSummaryInterface } from "./analytics-summary.interface";
import { AnalyticsTimelineInterface } from "./analytics-timeline.interface";
import { AnalyticsDimension, AnalyticsFilters, AnalyticsGranularity } from "./analytics.types";

function withFilters(endpoint: EndpointCreator, filters: AnalyticsFilters): EndpointCreator {
  endpoint.addAdditionalParam("from", filters.from);
  endpoint.addAdditionalParam("to", filters.to);
  endpoint.addAdditionalParam("section", filters.section);
  return endpoint;
}

export class AnalyticsAdminService extends AbstractService {
  /** Headline tiles: one row per window (current, previous). */
  static async getSummary(filters: AnalyticsFilters): Promise<AnalyticsSummaryInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.AnalyticsSummary }), filters);

    return this.callApi<AnalyticsSummaryInterface[]>({
      type: Modules.AnalyticsSummary,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async getTimeline(
    params: AnalyticsFilters & { granularity: AnalyticsGranularity },
  ): Promise<AnalyticsTimelineInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.AnalyticsTimeline }), params);
    endpoint.addAdditionalParam("granularity", params.granularity);

    return this.callApi<AnalyticsTimelineInterface[]>({
      type: Modules.AnalyticsTimeline,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async getBreakdown(
    params: AnalyticsFilters & { dimension: AnalyticsDimension; limit?: number },
  ): Promise<AnalyticsBreakdownInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.AnalyticsBreakdown }), params);
    endpoint.addAdditionalParam("dimension", params.dimension);
    if (params.limit !== undefined) endpoint.addAdditionalParam("limit", String(params.limit));

    return this.callApi<AnalyticsBreakdownInterface[]>({
      type: Modules.AnalyticsBreakdown,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /** Newest sessions first, cursor-paginated through `next`. */
  static async getSessions(
    params: AnalyticsFilters & { visitorId?: string; userId?: string; next?: NextRef },
  ): Promise<AnalyticsSessionInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.AnalyticsSession }), params);
    if (params.visitorId) endpoint.addAdditionalParam("visitorId", params.visitorId);
    if (params.userId) endpoint.addAdditionalParam("userId", params.userId);

    return this.callApi<AnalyticsSessionInterface[]>({
      type: Modules.AnalyticsSession,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async getSession(params: { id: string }): Promise<AnalyticsSessionInterface> {
    return this.callApi<AnalyticsSessionInterface>({
      type: Modules.AnalyticsSession,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.AnalyticsSession, id: params.id }).generate(),
    });
  }

  /** The journey: every page view of one session, oldest first. */
  static async getSessionPageViews(params: { sessionId: string }): Promise<AnalyticsPageViewInterface[]> {
    return this.callApi<AnalyticsPageViewInterface[]>({
      type: Modules.AnalyticsPageView,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.AnalyticsSession,
        id: params.sessionId,
        childEndpoint: Modules.AnalyticsPageView,
      }).generate(),
    });
  }
}
