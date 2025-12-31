import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../../core";
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
}
