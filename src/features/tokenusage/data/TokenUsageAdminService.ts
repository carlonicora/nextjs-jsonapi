import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { TokenUsageAdminBreakdownInterface } from "./tokenusage-admin-breakdown.interface";
import { TokenUsageAdminSummaryInterface } from "./tokenusage-admin-summary.interface";
import { TokenUsageAdminTimelineInterface } from "./tokenusage-admin-timeline.interface";
import { Dimension, Granularity, Scope, StackBy, TokenUsageAdminFilters } from "./tokenusage-admin.types";

function withFilters(endpoint: EndpointCreator, filters: TokenUsageAdminFilters): EndpointCreator {
  endpoint.addAdditionalParam("from", filters.from);
  endpoint.addAdditionalParam("to", filters.to);
  if (filters.companyId) endpoint.addAdditionalParam("companyId", filters.companyId);
  return endpoint;
}

export class TokenUsageAdminService extends AbstractService {
  /** Six rows: {customer, platform, total} × {current, previous}. */
  static async getSummary(filters: TokenUsageAdminFilters): Promise<TokenUsageAdminSummaryInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.TokenUsageAdminSummary }), filters);

    return this.callApi<TokenUsageAdminSummaryInterface[]>({
      type: Modules.TokenUsageAdminSummary,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async getTimeline(
    params: TokenUsageAdminFilters & { granularity: Granularity; stackBy: StackBy },
  ): Promise<TokenUsageAdminTimelineInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.TokenUsageAdminTimeline }), params);
    endpoint.addAdditionalParam("granularity", params.granularity);
    endpoint.addAdditionalParam("stackBy", params.stackBy);

    return this.callApi<TokenUsageAdminTimelineInterface[]>({
      type: Modules.TokenUsageAdminTimeline,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async getBreakdown(
    params: TokenUsageAdminFilters & { dimension: Dimension; scope: Scope; limit?: number },
  ): Promise<TokenUsageAdminBreakdownInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.TokenUsageAdminBreakdown }), params);
    endpoint.addAdditionalParam("dimension", params.dimension);
    endpoint.addAdditionalParam("scope", params.scope);
    if (params.limit !== undefined) endpoint.addAdditionalParam("limit", String(params.limit));

    return this.callApi<TokenUsageAdminBreakdownInterface[]>({
      type: Modules.TokenUsageAdminBreakdown,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}
