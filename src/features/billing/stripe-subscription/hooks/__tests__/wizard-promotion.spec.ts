import { describe, expect, it } from "vitest";
import { PromotionCodeValidationResult } from "../../../stripe-promotion-code/data/stripe-promotion-code.interface";
import {
  isDiscountSoldOut,
  isDiscountUnavailable,
  promotionCodeToSend,
  shouldLookUpAutomatic,
} from "../wizard-promotion";

const typed = { valid: true, promotionCodeId: "promo_typed", code: "SPRING" } as PromotionCodeValidationResult;
const automatic = {
  valid: true,
  promotionCodeId: "promo_auto",
  code: "FOUNDING",
  automatic: true,
} as PromotionCodeValidationResult;

/**
 * The error `AbstractService.callApi` throws for a non-ok response: `status` is the
 * HTTP status and `body` the JSON:API error document the API's HttpExceptionFilter sends.
 */
function apiError(status: number, code?: string): any {
  const error = new Error(`${status}:boom`) as any;
  error.status = status;
  error.digest = `HTTP_${status}`;
  error.body = {
    message: "boom",
    errors: [
      {
        status: String(status),
        ...(code ? { code } : {}),
        title: "Error",
        detail: "boom",
        source: { pointer: "/stripe-subscriptions" },
        meta: { timestamp: "2026-10-24T00:00:00.000Z", ...(code ? { context: { code } } : {}) },
      },
    ],
  };
  return error;
}

describe("promotionCodeToSend", () => {
  it("sends nothing when there is no code", () => {
    expect(promotionCodeToSend(null)).toBeUndefined();
  });

  it("sends the promotion code id of an automatic code", () => {
    expect(promotionCodeToSend(automatic)).toBe("promo_auto");
  });

  it("sends the promotion code id of a typed code", () => {
    expect(promotionCodeToSend(typed)).toBe("promo_typed");
  });
});

describe("shouldLookUpAutomatic", () => {
  it("looks up when there is no code", () => {
    expect(shouldLookUpAutomatic(null)).toBe(true);
  });

  it("looks up again when the current code is automatic", () => {
    expect(shouldLookUpAutomatic(automatic)).toBe(true);
  });

  it("does not look up when the GM typed a code", () => {
    expect(shouldLookUpAutomatic(typed)).toBe(false);
  });
});

describe("isDiscountSoldOut", () => {
  it("is true for a 410 carrying the discount_sold_out code", () => {
    expect(isDiscountSoldOut(apiError(410, "discount_sold_out"))).toBe(true);
  });

  it("reads the code from meta.context when the top-level code is missing", () => {
    const error = apiError(410, "discount_sold_out");
    delete error.body.errors[0].code;
    expect(isDiscountSoldOut(error)).toBe(true);
  });

  it("accepts the status on error.response", () => {
    const error = apiError(410, "discount_sold_out");
    delete error.status;
    error.response = { status: 410 };
    expect(isDiscountSoldOut(error)).toBe(true);
  });

  it("is false for a 410 without the code", () => {
    expect(isDiscountSoldOut(apiError(410))).toBe(false);
    expect(isDiscountSoldOut({ status: 410 })).toBe(false);
  });

  it("is false for the code on another status", () => {
    expect(isDiscountSoldOut(apiError(422, "discount_sold_out"))).toBe(false);
  });

  it("is false for other errors", () => {
    expect(isDiscountSoldOut(apiError(409))).toBe(false);
    expect(isDiscountSoldOut(apiError(402))).toBe(false);
    expect(isDiscountSoldOut(apiError(422, "discount_unavailable"))).toBe(false);
    expect(isDiscountSoldOut(new Error("boom"))).toBe(false);
    expect(isDiscountSoldOut(undefined)).toBe(false);
  });
});

describe("isDiscountUnavailable", () => {
  it("is true for a 422 carrying the discount_unavailable code", () => {
    expect(isDiscountUnavailable(apiError(422, "discount_unavailable"))).toBe(true);
  });

  it("reads the code from meta.context when the top-level code is missing", () => {
    const error = apiError(422, "discount_unavailable");
    delete error.body.errors[0].code;
    expect(isDiscountUnavailable(error)).toBe(true);
  });

  it("is false for a 422 without the code (a typed code's own rejection)", () => {
    expect(isDiscountUnavailable(apiError(422))).toBe(false);
    expect(isDiscountUnavailable({ status: 422 })).toBe(false);
  });

  it("is false for the code on another status", () => {
    expect(isDiscountUnavailable(apiError(410, "discount_unavailable"))).toBe(false);
  });

  it("is false for other errors", () => {
    expect(isDiscountUnavailable(apiError(410, "discount_sold_out"))).toBe(false);
    expect(isDiscountUnavailable(apiError(409))).toBe(false);
    expect(isDiscountUnavailable(new Error("boom"))).toBe(false);
    expect(isDiscountUnavailable(undefined)).toBe(false);
  });
});
