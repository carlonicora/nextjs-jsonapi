import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../../core";
import { PaymentMethodInterface } from "./payment-method.interface";
import { StripeCustomerInterface } from "./stripe-customer.interface";

/**
 * Customer-facing billing service for managing subscriptions, payments, and usage
 */
export class StripeCustomerService extends AbstractService {
  // ============================================================================
  // Customer Methods
  // ============================================================================

  /**
   * Get the current user's billing customer record
   */
  static async getCustomer(): Promise<StripeCustomerInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
      id: "me",
    });

    return this.callApi<StripeCustomerInterface>({
      type: Modules.BillingCustomer,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Create a billing customer for the current user
   */
  static async createCustomer(): Promise<StripeCustomerInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
    });

    return this.callApi<StripeCustomerInterface>({
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
  static async setDefaultPaymentMethod(params: { paymentMethodId: string }): Promise<StripeCustomerInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.BillingCustomer,
      id: "me",
      childEndpoint: "default-payment-method",
    });

    return this.callApi<StripeCustomerInterface>({
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
}
