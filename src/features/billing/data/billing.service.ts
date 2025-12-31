import {
  AbstractService,
  EndpointCreator,
  HttpMethod,
  Modules,
  NextRef,
  PreviousRef,
} from "../../../core";

// Import from new sub-modules for backwards compatibility re-exports
import { MeterInterface, MeterSummaryInterface } from "../stripe-usage/data/stripe-usage.interface";

/**
 * Legacy billing service - only contains meter methods
 * @deprecated Use StripeUsageService for meter methods, StripeInvoiceService for invoices,
 * StripeCustomerService for payment methods
 */
export class BillingService extends AbstractService {
  // ============================================================================
  // Meter Methods (kept here for backwards compatibility)
  // ============================================================================

  /**
   * List all available usage meters
   * @deprecated Use StripeUsageService.listMeters() instead
   */
  static async listMeters(params?: { next?: NextRef; prev?: PreviousRef }): Promise<MeterInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Billing,
      childEndpoint: "meters",
    });

    return this.callApi({
      type: Modules.Billing,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Get meter summaries for a specific time period
   * @deprecated Use StripeUsageService.getMeterSummaries() instead
   */
  static async getMeterSummaries(params: {
    meterId: string;
    start: Date;
    end: Date;
  }): Promise<MeterSummaryInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Billing,
      childEndpoint: `meters/${params.meterId}/summaries`,
    });

    endpoint.addAdditionalParam("start", params.start.toISOString());
    endpoint.addAdditionalParam("end", params.end.toISOString());

    return this.callApi({
      type: Modules.Billing,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}
