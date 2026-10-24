import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../../core";
import { ProrationPreviewInterface } from "../../stripe-invoice/data/stripe-invoice.interface";
import {
  StripeSubscriptionCreateMeta,
  StripeSubscriptionCreateResponse,
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
   * Returns subscription data along with meta containing SCA payment confirmation details
   */
  static async createSubscription(params: StripeSubscriptionInput): Promise<StripeSubscriptionCreateResponse> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
    });

    const result = await this.callApiWithMeta<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
      // The wizard reads 410 / 409 / 402 / 422 itself; a global handler must not swallow them
      suppressGlobalError: true,
    });

    return {
      subscription: result.data,
      meta: (result.meta as StripeSubscriptionCreateMeta) ?? {
        clientSecret: null,
        paymentIntentId: null,
        requiresAction: false,
      },
    };
  }

  /**
   * Change the plan of an existing subscription
   */
  static async changePlan(params: StripeSubscriptionInput): Promise<StripeSubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.id,
      childEndpoint: "change-plan",
    });

    return this.callApi<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
      // The wizard reads 410 / 409 / 402 / 422 itself; a global handler must not swallow them
      suppressGlobalError: true,
    });
  }

  /**
   * Change the plan of an existing subscription, with the payment meta.
   *
   * A trial upgrade charges at once; when the card asks for 3D Secure the API
   * answers with `meta.requiresAction` and the `clientSecret` to confirm in the
   * browser. Without that meta the change needs nothing more.
   */
  static async changePlanWithMeta(params: StripeSubscriptionInput): Promise<StripeSubscriptionCreateResponse> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.id,
      childEndpoint: "change-plan",
    });

    const result = await this.callApiWithMeta<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
      // The wizard reads 410 / 409 / 402 / 422 itself; a global handler must not swallow them
      suppressGlobalError: true,
    });

    return {
      subscription: result.data,
      meta: (result.meta as StripeSubscriptionCreateMeta) ?? {
        clientSecret: null,
        paymentIntentId: null,
        requiresAction: false,
      },
    };
  }

  /**
   * Get a proration preview for a plan change
   */
  static async getProrationPreview(params: {
    subscriptionId: string;
    newPriceId: string;
    quantity?: number;
  }): Promise<ProrationPreviewInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.subscriptionId,
      childEndpoint: "proration-preview",
    });

    endpoint.addAdditionalParam("priceId", params.newPriceId);
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
  static async cancelSubscription(params: StripeSubscriptionInput): Promise<StripeSubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.id,
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

  /**
   * Sync a subscription with the latest data from Stripe
   * This is useful after payment confirmation to get the updated status
   */
  static async syncSubscription(params: { subscriptionId: string }): Promise<StripeSubscriptionInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeSubscription,
      id: params.subscriptionId,
      childEndpoint: "sync",
    });

    return this.callApi<StripeSubscriptionInterface>({
      type: Modules.StripeSubscription,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      // The wizard logs a failed sync and carries on (the webhook catches up): no global error after a paid subscription
      suppressGlobalError: true,
    });
  }
}
