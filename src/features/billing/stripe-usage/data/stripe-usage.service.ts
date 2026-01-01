import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../../core";
import {
  MeterInterface,
  MeterSummaryInterface,
  ReportUsageInput,
  StripeUsageInterface,
  UsageSummaryInterface,
} from "./stripe-usage.interface";

/**
 * Service for managing Stripe usage tracking
 */
export class StripeUsageService extends AbstractService {
  // ============================================================================
  // Meter Methods
  // ============================================================================

  /**
   * List all available usage meters
   */
  static async listMeters(params?: { next?: NextRef; prev?: PreviousRef }): Promise<MeterInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeUsage,
      childEndpoint: "meters",
    });

    return this.callApi({
      type: Modules.StripeUsage,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Get meter summaries for a specific time period
   */
  static async getMeterSummaries(params: {
    meterId: string;
    startTime: Date;
    endTime: Date;
  }): Promise<MeterSummaryInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeUsage,
      childEndpoint: `meters/${params.meterId}/summaries`,
    });

    endpoint.addAdditionalParam("startTime", params.startTime.toISOString());
    endpoint.addAdditionalParam("endTime", params.endTime.toISOString());

    return this.callApi({
      type: Modules.StripeUsage,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  // ============================================================================
  // Usage Record Methods
  // ============================================================================

  /**
   * Report usage for a subscription item
   */
  static async reportUsage(params: ReportUsageInput): Promise<StripeUsageInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeUsage,
    });

    return this.callApi<StripeUsageInterface>({
      type: Modules.StripeUsage,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * List usage records for a subscription item
   */
  static async listUsageRecords(params: {
    subscriptionItemId: string;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<StripeUsageInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeUsage,
    });

    endpoint.addAdditionalParam("subscriptionItemId", params.subscriptionItemId);

    return this.callApi({
      type: Modules.StripeUsage,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Get usage summary for a subscription item
   */
  static async getUsageSummary(params: {
    subscriptionItemId: string;
    start?: Date;
    end?: Date;
  }): Promise<UsageSummaryInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeUsage,
      childEndpoint: "summary",
    });

    endpoint.addAdditionalParam("subscriptionItemId", params.subscriptionItemId);
    if (params.start) {
      endpoint.addAdditionalParam("start", params.start.toISOString());
    }
    if (params.end) {
      endpoint.addAdditionalParam("end", params.end.toISOString());
    }

    return this.callApi({
      type: Modules.StripeUsage,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}
