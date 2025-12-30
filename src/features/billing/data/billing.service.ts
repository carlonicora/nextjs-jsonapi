import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../core";
import { BillingCustomerInterface } from "./billing-customer.interface";
import {
  CancelSubscriptionInput,
  ChangePlanInput,
  CreateSubscriptionInput,
  SubscriptionInterface,
} from "./subscription.interface";
import { InvoiceInterface, ProrationPreview } from "./invoice.interface";
import {
  MeterInterface,
  MeterSummaryInterface,
  UsageRecordInterface,
  UsageSummaryInterface,
  ReportUsageInput,
} from "./usage-record.interface";
import { PaymentMethodInterface } from "./payment-method.interface";

/**
 * Customer-facing billing service for managing subscriptions, payments, and usage
 */
export class BillingService extends AbstractService {
  // ============================================================================
  // Customer Methods
  // ============================================================================

  /**
   * Get the current user's billing customer record
   */
  static async getCustomer(): Promise<BillingCustomerInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
      id: "me",
    });

    return this.callApi<BillingCustomerInterface>({
      type: Modules.BillingCustomer,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Create a billing customer for the current user
   */
  static async createCustomer(): Promise<BillingCustomerInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
    });

    return this.callApi<BillingCustomerInterface>({
      type: Modules.BillingCustomer,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Create a setup intent for adding payment methods
   */
  static async createSetupIntent(): Promise<{ clientSecret: string }> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
      id: "me",
      childEndpoint: "setup-intent",
    });

    return this.callApi({
      type: Modules.BillingCustomer,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Create a Stripe customer portal session URL
   */
  static async createPortalSession(): Promise<{ url: string }> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
      id: "me",
      childEndpoint: "portal-session",
    });

    return this.callApi({
      type: Modules.BillingCustomer,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }

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
  static async setDefaultPaymentMethod(params: { paymentMethodId: string }): Promise<BillingCustomerInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
      id: "me",
      childEndpoint: "default-payment-method",
    });

    return this.callApi<BillingCustomerInterface>({
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
  // Subscription Methods
  // ============================================================================

  /**
   * List all subscriptions for the current user
   */
  static async listSubscriptions(params?: { next?: NextRef; prev?: PreviousRef }): Promise<SubscriptionInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Subscription,
    });

    return this.callApi({
      type: Modules.Subscription,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Get a specific subscription by ID
   */
  static async getSubscription(params: { subscriptionId: string }): Promise<SubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Subscription,
      id: params.subscriptionId,
    });

    return this.callApi<SubscriptionInterface>({
      type: Modules.Subscription,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(params: CreateSubscriptionInput): Promise<SubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Subscription,
    });

    return this.callApi<SubscriptionInterface>({
      type: Modules.Subscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Change the plan of an existing subscription
   */
  static async changePlan(params: ChangePlanInput): Promise<SubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Subscription,
      id: params.subscriptionId,
      childEndpoint: "change-plan",
    });

    return this.callApi<SubscriptionInterface>({
      type: Modules.Subscription,
      method: HttpMethod.PUT,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Get a proration preview for a plan change
   */
  static async getProrationPreview(params: {
    subscriptionId: string;
    newPriceId: string;
    quantity?: number;
  }): Promise<ProrationPreview> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Subscription,
      id: params.subscriptionId,
      childEndpoint: "proration-preview",
    });

    endpoint.addAdditionalParam("newPriceId", params.newPriceId);
    if (params.quantity) {
      endpoint.addAdditionalParam("quantity", params.quantity.toString());
    }

    return this.callApi({
      type: Modules.Subscription,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(params: CancelSubscriptionInput): Promise<SubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Subscription,
      id: params.subscriptionId,
      childEndpoint: "cancel",
    });

    return this.callApi<SubscriptionInterface>({
      type: Modules.Subscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Pause a subscription
   */
  static async pauseSubscription(params: { subscriptionId: string }): Promise<SubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Subscription,
      id: params.subscriptionId,
      childEndpoint: "pause",
    });

    return this.callApi<SubscriptionInterface>({
      type: Modules.Subscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Resume a paused subscription
   */
  static async resumeSubscription(params: { subscriptionId: string }): Promise<SubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Subscription,
      id: params.subscriptionId,
      childEndpoint: "resume",
    });

    return this.callApi<SubscriptionInterface>({
      type: Modules.Subscription,
      method: HttpMethod.POST,
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
