import { describe, expect, it } from "vitest";
import { couponPlacesLeft, couponPlacesTotal } from "../coupon-places";

describe("coupon places", () => {
  it("returns null when neither limit is set", () =>
    expect(couponPlacesLeft({ timesRedeemed: 3 }, { timesRedeemed: 3 })).toBeNull());
  it("uses the coupon limit alone", () =>
    expect(couponPlacesLeft({ timesRedeemed: 0 }, { maxRedemptions: 50, timesRedeemed: 13 })).toBe(37));
  it("takes the smaller of coupon and code", () =>
    expect(couponPlacesLeft({ maxRedemptions: 10, timesRedeemed: 8 }, { maxRedemptions: 50, timesRedeemed: 13 })).toBe(
      2,
    ));
  it("never goes below zero", () =>
    expect(couponPlacesLeft({ timesRedeemed: 0 }, { maxRedemptions: 50, timesRedeemed: 51 })).toBe(0));
  it("placesTotal is the smaller set limit", () =>
    expect(couponPlacesTotal({ maxRedemptions: 10, timesRedeemed: 0 }, { maxRedemptions: 50, timesRedeemed: 0 })).toBe(
      10,
    ));
});
