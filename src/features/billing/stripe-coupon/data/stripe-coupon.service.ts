import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../../core";
import { STRIPE_COUPON_REFRESH_SEGMENT } from "../stripe-coupon.module";
import { StripeCoupon } from "./stripe-coupon";
import { StripeCouponInput, StripeCouponInterface, StripeCouponRenameInput } from "./stripe-coupon.interface";

/**
 * Admin billing service for managing coupons
 */
export class StripeCouponService extends AbstractService {
  /**
   * List all coupons with their codes (admin)
   */
  static async listCoupons(params?: { next?: NextRef; prev?: PreviousRef }): Promise<StripeCouponInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeCoupon,
    });

    return this.callApi({
      type: Modules.StripeCoupon,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Get a specific coupon by ID (admin)
   */
  static async getCoupon(params: { id: string }): Promise<StripeCouponInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeCoupon,
      id: params.id,
    });

    return this.callApi<StripeCouponInterface>({
      type: Modules.StripeCoupon,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Create a coupon and its first code (admin)
   */
  static async createCoupon(params: StripeCouponInput): Promise<StripeCouponInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeCoupon,
    });

    return this.callApi<StripeCouponInterface>({
      type: Modules.StripeCoupon,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Rename a coupon (admin). The only coupon field Stripe allows to change.
   */
  static async renameCoupon(params: StripeCouponRenameInput): Promise<StripeCouponInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeCoupon,
      id: params.id,
    });

    return this.callApi<StripeCouponInterface>({
      type: Modules.StripeCoupon,
      method: HttpMethod.PATCH,
      endpoint: endpoint.generate(),
      input: new StripeCoupon().createRenameJsonApi(params),
      overridesJsonApiCreation: true,
    });
  }

  /**
   * Re-read the coupon and its codes from Stripe and store the counts (admin)
   */
  static async refreshCounts(params: { id: string }): Promise<StripeCouponInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeCoupon,
      id: params.id,
      childEndpoint: STRIPE_COUPON_REFRESH_SEGMENT,
    });

    return this.callApi<StripeCouponInterface>({
      type: Modules.StripeCoupon,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }
}
