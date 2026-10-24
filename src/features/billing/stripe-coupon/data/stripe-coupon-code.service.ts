import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../../core";
import { STRIPE_COUPON_CODE_AUTOMATIC_SEGMENT } from "../stripe-coupon-code.module";
import { StripeCouponCode } from "./stripe-coupon-code";
import {
  StripeCouponCodeFlagsInput,
  StripeCouponCodeInput,
  StripeCouponCodeInterface,
} from "./stripe-coupon-code.interface";

/**
 * Billing service for the customer-facing codes of a coupon
 */
export class StripeCouponCodeService extends AbstractService {
  /**
   * List the codes of a coupon (admin)
   */
  static async listByCoupon(params: {
    couponId: string;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<StripeCouponCodeInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeCoupon,
      id: params.couponId,
      childEndpoint: Modules.StripeCouponCode,
    });

    return this.callApi({
      type: Modules.StripeCouponCode,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
      previous: params.prev,
    });
  }

  /**
   * Create a code on an existing coupon (admin)
   */
  static async createCode(params: StripeCouponCodeInput): Promise<StripeCouponCodeInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeCouponCode,
    });

    return this.callApi<StripeCouponCodeInterface>({
      type: Modules.StripeCouponCode,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  /**
   * Switch "Apply automatically" and / or deactivate / reactivate a code (admin)
   */
  static async updateFlags(params: StripeCouponCodeFlagsInput): Promise<StripeCouponCodeInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeCouponCode,
      id: params.id,
    });

    return this.callApi<StripeCouponCodeInterface>({
      type: Modules.StripeCouponCode,
      method: HttpMethod.PATCH,
      endpoint: endpoint.generate(),
      input: new StripeCouponCode().createFlagsJsonApi(params),
      overridesJsonApiCreation: true,
    });
  }

  /**
   * The code the server would apply automatically for this price at a first
   * payment, or null when none applies (logged-in company administrator)
   */
  static async findAutomatic(params: { priceId: string }): Promise<StripeCouponCodeInterface | null> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.StripeCouponCode,
      id: STRIPE_COUPON_CODE_AUTOMATIC_SEGMENT,
    });
    endpoint.addAdditionalParam("priceId", params.priceId);

    const codes = await this.callApi<StripeCouponCodeInterface[]>({
      type: Modules.StripeCouponCode,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      // A failed lookup must reach the wizard, which then refuses to show full price as the truth
      suppressGlobalError: true,
    });

    return codes?.[0] ?? null;
  }
}
