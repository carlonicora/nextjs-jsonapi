import { Modules } from "../../../../core";
import { JsonApiPost } from "../../../../unified/JsonApiRequest";
import { PromotionCodeValidationResult } from "./stripe-promotion-code.interface";
import { StripePromotionCode } from "./stripe-promotion-code";

const STRIPE_PROMOTION_CODE_ENDPOINT = "stripe-promotion-codes";

/**
 * Service for validating Stripe promotion codes
 */
export class StripePromotionCodeService {
  /**
   * Validate a promotion code against Stripe
   *
   * @param params.code - The promotion code to validate (e.g., "SAVE20")
   * @param params.stripePriceId - Optional price ID to check product restrictions
   * @param params.language - Language code for the request
   * @returns Validation result with discount details if valid
   */
  static async validatePromotionCode(params: {
    code: string;
    stripePriceId?: string;
    language?: string;
  }): Promise<PromotionCodeValidationResult> {
    const response = await JsonApiPost({
      classKey: Modules.StripePromotionCode,
      endpoint: `${STRIPE_PROMOTION_CODE_ENDPOINT}/validate`,
      body: {
        data: {
          type: STRIPE_PROMOTION_CODE_ENDPOINT,
          attributes: {
            code: params.code,
            stripePriceId: params.stripePriceId,
          },
        },
      },
      overridesJsonApiCreation: true,
      language: params.language ?? "en",
    });

    if (!response.ok) {
      return {
        valid: false,
        code: params.code,
        errorMessage: response.error || "Failed to validate promotion code",
      };
    }

    // The response is hydrated as a StripePromotionCode model
    const data = response.data as StripePromotionCode;

    return {
      valid: data.valid,
      promotionCodeId: data.promotionCodeId,
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      currency: data.currency,
      duration: data.duration,
      durationInMonths: data.durationInMonths,
      errorMessage: data.errorMessage,
    };
  }
}
