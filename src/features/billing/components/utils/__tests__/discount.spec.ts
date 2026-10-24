import { describe, expect, it } from "vitest";
import { StripeSubscriptionInterface } from "../../../stripe-subscription/data/stripe-subscription.interface";
import { applyDiscount, promotionCodeDiscount, subscriptionDiscount } from "../discount";

const subscription = (discount: StripeSubscriptionInterface["discount"]) =>
  ({ discount }) as unknown as StripeSubscriptionInterface;

describe("applyDiscount", () => {
  it("takes a percentage off", () => {
    expect(applyDiscount(999, { discountType: "percent_off", discountValue: 20 })).toBeCloseTo(799.2);
  });

  it("takes an amount off without going below zero", () => {
    expect(applyDiscount(499, { discountType: "amount_off", discountValue: 100 })).toBe(399);
    expect(applyDiscount(499, { discountType: "amount_off", discountValue: 1000 })).toBe(0);
  });

  it("returns null without a discount or an amount", () => {
    expect(applyDiscount(999, null)).toBeNull();
    expect(applyDiscount(undefined, { discountType: "percent_off", discountValue: 20 })).toBeNull();
  });
});

describe("promotionCodeDiscount", () => {
  it("reads a valid code", () => {
    expect(
      promotionCodeDiscount({ valid: true, code: "FOUNDER", discountType: "percent_off", discountValue: 20 }),
    ).toEqual({ discountType: "percent_off", discountValue: 20, currency: undefined });
  });

  it("ignores an invalid or missing code", () => {
    expect(
      promotionCodeDiscount({ valid: false, code: "X", discountType: "percent_off", discountValue: 20 }),
    ).toBeNull();
    expect(promotionCodeDiscount(null)).toBeNull();
  });
});

describe("subscriptionDiscount", () => {
  it("reads a percentage discount", () => {
    expect(subscriptionDiscount(subscription({ percentOff: 20, duration: "forever" }))).toEqual({
      discountType: "percent_off",
      discountValue: 20,
    });
  });

  it("reads an amount discount with its currency", () => {
    expect(subscriptionDiscount(subscription({ amountOff: 200, currency: "eur", duration: "once" }))).toEqual({
      discountType: "amount_off",
      discountValue: 200,
      currency: "eur",
    });
  });

  it("returns null when the subscription has no discount", () => {
    expect(subscriptionDiscount(subscription(undefined))).toBeNull();
    expect(subscriptionDiscount(undefined)).toBeNull();
  });
});
