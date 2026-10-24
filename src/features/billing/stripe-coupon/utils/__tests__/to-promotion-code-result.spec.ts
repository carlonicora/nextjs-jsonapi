import { describe, expect, it } from "vitest";
import { StripeCouponCodeInterface } from "../../data/stripe-coupon-code.interface";
import { StripeCouponInterface } from "../../data/stripe-coupon.interface";
import { toPromotionCodeResult } from "../to-promotion-code-result";

const codeWith = (coupon: Partial<StripeCouponInterface>): StripeCouponCodeInterface =>
  ({ stripePromotionCodeId: "promo_1", code: "FOUNDER", coupon }) as unknown as StripeCouponCodeInterface;

describe("toPromotionCodeResult", () => {
  it("maps a percentage coupon", () => {
    expect(
      toPromotionCodeResult(codeWith({ discountType: "percent_off", percentOff: 20, duration: "forever" })),
    ).toEqual({
      valid: true,
      automatic: true,
      promotionCodeId: "promo_1",
      code: "FOUNDER",
      discountType: "percent_off",
      discountValue: 20,
      duration: "forever",
    });
  });

  it("maps a fixed-amount coupon to amountOff and its currency", () => {
    const result = toPromotionCodeResult(
      codeWith({
        discountType: "amount_off",
        amountOff: 500,
        currency: "eur",
        duration: "repeating",
        durationInMonths: 3,
      }),
    );
    expect(result.discountType).toBe("amount_off");
    expect(result.discountValue).toBe(500);
    expect(result.currency).toBe("eur");
    expect(result.duration).toBe("repeating");
    expect(result.durationInMonths).toBe(3);
    expect(result.automatic).toBe(true);
  });
});
