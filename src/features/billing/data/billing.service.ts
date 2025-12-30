import {
  AbstractService,
  EndpointCreator,
  HttpMethod,
  Modules,
  NextRef,
  PreviousRef,
  StripeBillingCustomerInterface,
} from "../../../core";
import { InvoiceInterface } from "./invoice.interface";
import { PaymentMethodInterface } from "./payment-method.interface";
import {
  MeterInterface,
  MeterSummaryInterface,
  ReportUsageInput,
  UsageRecordInterface,
  UsageSummaryInterface,
} from "./usage-record.interface";

/**
 * Customer-facing billing service for managing subscriptions, payments, and usage
 */
export class BillingService extends AbstractService {
  // ============================================================================
  // Payment Method Methods
  // ============================================================================

  /**
   * List all payment methods for the current user
   */
  static async listPaymentMethods(params?: { next?: NextRef; prev?: PreviousRef }): Promise<PaymentMethodInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
      id: "me",
      childEndpoint: "payment-methods",
    });

    return this.callApi({
      type: Modules.BillingCustomer,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Set the default payment method for the current user
   */
  static async setDefaultPaymentMethod(params: { paymentMethodId: string }): Promise<StripeBillingCustomerInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
      id: "me",
      childEndpoint: "default-payment-method",
    });

    return this.callApi<StripeBillingCustomerInterface>({
      type: Modules.BillingCustomer,
      method: HttpMethod.PUT,
      endpoint: endpoint.generate(),
      input: { paymentMethodId: params.paymentMethodId },
    });
  }

  /**
   * Remove a payment method
   */
  static async removePaymentMethod(params: { paymentMethodId: string }): Promise<void> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
      id: "me",
      childEndpoint: `payment-methods/${params.paymentMethodId}`,
    });

    await this.callApi({
      type: Modules.BillingCustomer,
      method: HttpMethod.DELETE,
      endpoint: endpoint.generate(),
    });
  }

  // ============================================================================
  // Invoice Methods
  // ============================================================================

  /**
   * List all invoices for the current user
   */
  static async listInvoices(params?: {
    status?: string;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<InvoiceInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Invoice,
    });

    if (params?.status) {
      endpoint.addAdditionalParam("status", params.status);
    }

    return this.callApi({
      type: Modules.Invoice,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Get a specific invoice by ID
   */
  static async getInvoice(params: { invoiceId: string }): Promise<InvoiceInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Invoice,
      id: params.invoiceId,
    });

    return this.callApi<InvoiceInterface>({
      type: Modules.Invoice,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Get the upcoming invoice for the current user
   */
  static async getUpcomingInvoice(): Promise<InvoiceInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Invoice,
      id: "upcoming",
    });

    return this.callApi<InvoiceInterface>({
      type: Modules.Invoice,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  // ============================================================================
  // Usage Tracking Methods
  // ============================================================================

  /**
   * List all available usage meters
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

  /**
   * Report usage for a subscription item
   */
  static async reportUsage(params: ReportUsageInput): Promise<UsageRecordInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.UsageRecord,
    });

    return this.callApi<UsageRecordInterface>({
      type: Modules.UsageRecord,
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
  }): Promise<UsageRecordInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.UsageRecord,
    });

    endpoint.addAdditionalParam("subscriptionItemId", params.subscriptionItemId);

    return this.callApi({
      type: Modules.UsageRecord,
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
      endpoint: Modules.UsageRecord,
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
      type: Modules.UsageRecord,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}
