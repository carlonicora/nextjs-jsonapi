import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../core";
import {
  StripeProductInterface,
  StripePriceInterface,
  CreateProductInput,
  UpdateProductInput,
  CreatePriceInput,
  UpdatePriceInput,
} from "./billing.interface";

/**
 * Admin billing service for managing products and prices
 */
export class BillingAdminService extends AbstractService {
  // ============================================================================
  // Product Methods
  // ============================================================================

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
  static async getProduct(params: { productId: string }): Promise<StripeProductInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeProduct,
      id: params.productId,
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
  static async createProduct(params: CreateProductInput): Promise<StripeProductInterface> {
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
  static async updateProduct(params: UpdateProductInput): Promise<StripeProductInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeProduct,
      id: params.productId,
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
  static async archiveProduct(params: { productId: string }): Promise<StripeProductInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeProduct,
      id: params.productId,
      childEndpoint: "archive",
    });

    return this.callApi<StripeProductInterface>({
      type: Modules.StripeProduct,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }

  // ============================================================================
  // Price Methods
  // ============================================================================

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
  static async getPrice(params: { priceId: string }): Promise<StripePriceInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripePrice,
      id: params.priceId,
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
  static async createPrice(params: CreatePriceInput): Promise<StripePriceInterface> {
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
  static async updatePrice(params: UpdatePriceInput): Promise<StripePriceInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripePrice,
      id: params.priceId,
    });

    return this.callApi<StripePriceInterface>({
      type: Modules.StripePrice,
      method: HttpMethod.PUT,
      endpoint: endpoint.generate(),
      input: params,
    });
  }
}
