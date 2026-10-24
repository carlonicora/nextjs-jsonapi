import { describe, expect, it } from "vitest";
import { PaymentMethodInterface } from "../../../../stripe-customer/data/payment-method.interface";
import { reviewCard } from "../review-card";

const card = (id: string, brand: string, last4: string): PaymentMethodInterface => ({
  id,
  type: "card",
  card: { brand, last4, expMonth: 1, expYear: 2030 },
});

describe("reviewCard", () => {
  it("returns null when there is no card", () => {
    expect(reviewCard([], "pm_1")).toBe(null);
    expect(reviewCard(null, null)).toBe(null);
    expect(reviewCard(undefined, undefined)).toBe(null);
  });

  it("returns the customer's default card", () => {
    expect(reviewCard([card("pm_new", "visa", "4242"), card("pm_old", "mastercard", "0005")], "pm_old")).toEqual({
      brand: "Mastercard",
      last4: "0005",
    });
  });

  it("falls back to the first card when no default is set or the default is gone", () => {
    const methods = [card("pm_new", "visa", "4242"), card("pm_old", "mastercard", "0005")];
    expect(reviewCard(methods, null)).toEqual({ brand: "Visa", last4: "4242" });
    expect(reviewCard(methods, "pm_detached")).toEqual({ brand: "Visa", last4: "4242" });
  });

  it("returns null when the card has no last 4 digits", () => {
    expect(reviewCard([{ id: "pm_1", type: "sepa_debit" }], "pm_1")).toBe(null);
  });
});
