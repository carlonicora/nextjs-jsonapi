/**
 * Places left on a code: the smaller of (coupon limit - coupon redeemed) and
 * (code limit - code redeemed), counting only the limits that are set, never
 * below zero. `null` = unlimited. Same rule as the backend `placesLeft`.
 */
type Redeemable = { maxRedemptions?: number; timesRedeemed: number };

export function couponPlacesLeft(code: Redeemable, coupon: Redeemable): number | null {
  const remaining = [code, coupon]
    .filter((item) => typeof item.maxRedemptions === "number")
    .map((item) => Math.max(0, (item.maxRedemptions as number) - (item.timesRedeemed ?? 0)));

  return remaining.length === 0 ? null : Math.min(...remaining);
}

/** The smaller of the set limits, or `null` when neither is set. */
export function couponPlacesTotal(code: Redeemable, coupon: Redeemable): number | null {
  const limits = [code.maxRedemptions, coupon.maxRedemptions].filter(
    (limit): limit is number => typeof limit === "number",
  );

  return limits.length === 0 ? null : Math.min(...limits);
}
