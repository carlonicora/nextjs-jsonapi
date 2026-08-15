import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { TokenUsageReportBreakdownInterface } from "./tokenusage-report-breakdown.interface";
import { TokenUsageReportSummaryInterface } from "./tokenusage-report-summary.interface";
import { TokenUsageReportTimelineInterface } from "./tokenusage-report-timeline.interface";
import { ReportDimension, ReportMetric, TokenUsageReportFilters } from "./tokenusage-report.types";

function withFilters(endpoint: EndpointCreator, filters: TokenUsageReportFilters): EndpointCreator {
  endpoint.addAdditionalParam("from", filters.from);
  endpoint.addAdditionalParam("to", filters.to);
  return endpoint;
}

/**
 * The self-service token-usage endpoints.
 *
 * No companyId parameter anywhere: the backend scopes every query to the
 * caller's own company through the CLS preamble, so there is nothing for the
 * client to name. No `metric: "cost"` either — the controller rejects it.
 */
export class TokenUsageReportService extends AbstractService {
  /** Two rows: window "current" and "previous". */
  static async getSummary(filters: TokenUsageReportFilters): Promise<TokenUsageReportSummaryInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.TokenUsageReportSummary }), filters);

    return this.callApi<TokenUsageReportSummaryInterface[]>({
      type: Modules.TokenUsageReportSummary,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async getTimeline(
    params: TokenUsageReportFilters & { granularity: "day" },
  ): Promise<TokenUsageReportTimelineInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.TokenUsageReportTimeline }), params);
    endpoint.addAdditionalParam("granularity", params.granularity);

    return this.callApi<TokenUsageReportTimelineInterface[]>({
      type: Modules.TokenUsageReportTimeline,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async getBreakdown(
    params: TokenUsageReportFilters & {
      dimension: ReportDimension;
      targetLabel?: string;
      metric: ReportMetric;
      limit?: number;
    },
  ): Promise<TokenUsageReportBreakdownInterface[]> {
    const endpoint = withFilters(new EndpointCreator({ endpoint: Modules.TokenUsageReportBreakdown }), params);
    endpoint.addAdditionalParam("dimension", params.dimension);
    if (params.targetLabel) endpoint.addAdditionalParam("targetLabel", params.targetLabel);
    endpoint.addAdditionalParam("metric", params.metric);
    if (params.limit !== undefined) endpoint.addAdditionalParam("limit", String(params.limit));

    return this.callApi<TokenUsageReportBreakdownInterface[]>({
      type: Modules.TokenUsageReportBreakdown,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}
