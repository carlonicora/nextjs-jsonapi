import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../../core";
import { StripePriceInput, StripePriceInterface } from "./stripe-price.interface";

/**
 * Admin billing service for managing products and prices
 */
export class StripePriceService extends AbstractService {
  /**
   * List all prices (admin)
   */
  static async listPrices(params?: {
    productId?: string;
    active?: boolean;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<StripePriceInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripePrice,
    });

    if (params?.productId) {
      endpoint.addAdditionalParam("productId", params.productId);
    }
    if (params?.active !== undefined) {
      endpoint.addAdditionalParam("active", params.active.toString());
    }

    return this.callApi({
      type: Modules.StripePrice,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Get a specific price by ID (admin)
   */
  static async getPrice(params: { id: string }): Promise<StripePriceInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripePrice,
      id: params.id,
    });

    return this.callApi<StripePriceInterface>({
      type: Modules.StripePrice,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Create a new price (admin)
   */
  static async createPrice(params: StripePriceInput): Promise<StripePriceInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripePrice,
    });

    return this.callApi<StripePriceInterface>({
      type: Modules.StripePrice,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Update an existing price (admin)
   */
  static async updatePrice(params: StripePriceInput): Promise<StripePriceInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripePrice,
      id: params.id,
    });

    return this.callApi<StripePriceInterface>({
      type: Modules.StripePrice,
      method: HttpMethod.PUT,
      endpoint: endpoint.generate(),
      input: params,
    });
  }
}
