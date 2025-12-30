import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../../core";
import { ProrationPreview } from "../../data/invoice.interface";
import {
  CancelSubscriptionInput,
  ChangePlanInput,
  StripeSubscriptionInput,
  StripeSubscriptionInterface,
} from "./stripe-subscription.interface";

/**
 * Customer-facing billing service for managing subscriptions, payments, and usage
 */
export class StripeSubscriptionService extends AbstractService {
  // ============================================================================
  // Subscription Methods
  // ============================================================================

  /**
   * List all subscriptions for the current user
   */
  static async listSubscriptions(params?: {
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<StripeSubscriptionInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
    });

    return this.callApi({
      type: Modules.StripeSubscription,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Get a specific subscription by ID
   */
  static async getSubscription(params: { subscriptionId: string }): Promise<StripeSubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.subscriptionId,
    });

    return this.callApi<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(params: StripeSubscriptionInput): Promise<StripeSubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
    });

    return this.callApi<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Change the plan of an existing subscription
   */
  static async changePlan(params: ChangePlanInput): Promise<StripeSubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.subscriptionId,
      childEndpoint: "change-plan",
    });

    return this.callApi<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
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
      endpoint: Modules.StripeSubscription,
      id: params.subscriptionId,
      childEndpoint: "proration-preview",
    });

    endpoint.addAdditionalParam("newPriceId", params.newPriceId);
    if (params.quantity) {
      endpoint.addAdditionalParam("quantity", params.quantity.toString());
    }

    return this.callApi({
      type: Modules.StripeSubscription,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(params: CancelSubscriptionInput): Promise<StripeSubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.subscriptionId,
      childEndpoint: "cancel",
    });

    return this.callApi<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Pause a subscription
   */
  static async pauseSubscription(params: { subscriptionId: string }): Promise<StripeSubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.subscriptionId,
      childEndpoint: "pause",
    });

    return this.callApi<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Resume a paused subscription
   */
  static async resumeSubscription(params: { subscriptionId: string }): Promise<StripeSubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.subscriptionId,
      childEndpoint: "resume",
    });

    return this.callApi<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }
}
