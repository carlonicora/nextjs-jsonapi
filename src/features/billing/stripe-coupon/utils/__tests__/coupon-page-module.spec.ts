import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { StripeCoupon } from "../../data/stripe-coupon";
import { STRIPE_COUPON_DETAIL_PAGE_URL } from "../../stripe-coupon.module";
import { couponPageModule } from "../coupon-page-module";

// couponPageModule() resolves Modules.StripeCoupon through the real ModuleRegistry.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("StripeCoupon", {
    name: "stripe-coupons",
    pageUrl: "/administration/products",
    model: StripeCoupon,
  } as any);
});

describe("couponPageModule", () => {
  // The coupon page's tabs and the editor build `<pageUrl>/<couponId>` from this module:
  // with the products pageUrl that is a products route, which answers Not Found.
  it("points at the coupon's own route, not the products page", () =>
    expect(couponPageModule().pageUrl).toBe(STRIPE_COUPON_DETAIL_PAGE_URL));

  it("keeps the rest of the coupon module", () => expect(couponPageModule().name).toBe("stripe-coupons"));
});
