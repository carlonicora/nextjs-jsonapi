import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../../core";
import { StripeProductInput, StripeProductInterface } from "./stripe-product.interface";

export class StripeProductService extends AbstractService {
  /**
   * List all products (admin)
   */
  static async listProducts(params?: {
    active?: boolean;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<StripeProductInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeProduct,
    });

    if (params?.active !== undefined) {
      endpoint.addAdditionalParam("active", params.active.toString());
    }

    return this.callApi({
      type: Modules.StripeProduct,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Get a specific product by ID (admin)
   */
  static async getProduct(params: { id: string }): Promise<StripeProductInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeProduct,
      id: params.id,
    });

    return this.callApi<StripeProductInterface>({
      type: Modules.StripeProduct,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Create a new product (admin)
   */
  static async createProduct(params: StripeProductInput): Promise<StripeProductInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeProduct,
    });

    return this.callApi<StripeProductInterface>({
      type: Modules.StripeProduct,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Update an existing product (admin)
   */
  static async updateProduct(params: StripeProductInput): Promise<StripeProductInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeProduct,
      id: params.id,
    });

    return this.callApi<StripeProductInterface>({
      type: Modules.StripeProduct,
      method: HttpMethod.PUT,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Archive a product (admin)
   */
  static async archiveProduct(params: { id: string }): Promise<StripeProductInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeProduct,
      id: params.id,
      childEndpoint: "archive",
    });

    return this.callApi<StripeProductInterface>({
      type: Modules.StripeProduct,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Reactivate a product (admin) - sets active to true
   */
  static async reactivateProduct(params: { id: string }): Promise<StripeProductInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeProduct,
      id: params.id,
      childEndpoint: "archive",
    });

    return this.callApi<StripeProductInterface>({
      type: Modules.StripeProduct,
      method: HttpMethod.DELETE,
      endpoint: endpoint.generate(),
    });
  }
}
