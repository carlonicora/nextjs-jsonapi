import { Modules } from "../../../../core";
import { STRIPE_COUPON_DETAIL_PAGE_URL } from "../stripe-coupon.module";

/**
 * The module with the coupon's own route as pageUrl: the module's pageUrl is the
 * products page (the coupons list is its Codes tab), so anything that builds a
 * URL for one coupon from the module (EditorSheet's navigate / revalidate after a
 * save, RoundPageContainer's tab rewrite) would otherwise land on
 * `/administration/products/<couponId>`.
 */
export function couponPageModule() {
  return { ...Modules.StripeCoupon, pageUrl: STRIPE_COUPON_DETAIL_PAGE_URL };
}
