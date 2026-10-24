import { beforeAll, describe, expect, it } from "vitest";
import { DataClassRegistry } from "../../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../../permissions/types";
import { StripeCouponCodeModule } from "../../stripe-coupon-code.module";
import { StripeCouponModule } from "../../stripe-coupon.module";
import { StripeCouponOfferModule } from "../../stripe-coupon-offer.module";
import { StripeCoupon } from "../stripe-coupon";
import { StripeCouponCode } from "../stripe-coupon-code";

// createJsonApi reads Modules.X.name (resolved lazily via ModuleRegistry), and
// _readIncluded rehydrates through the registered model, so the modules must be
// registered first — mirrors email-automation-models.spec.
const moduleFactory: ModuleFactory = (params) =>
  ({
    pageUrl: params.pageUrl,
    name: params.name,
    model: params.model,
  }) as ModuleWithPermissions;

beforeAll(() => {
  const coupon = StripeCouponModule(moduleFactory);
  const code = StripeCouponCodeModule(moduleFactory);
  ModuleRegistry.register("StripeCoupon", coupon);
  ModuleRegistry.register("StripeCouponCode", code);
  ModuleRegistry.register("StripeCouponOffer", StripeCouponOfferModule(moduleFactory));
  // The included code is rehydrated through the class registry (normally filled by bootstrap()).
  DataClassRegistry.registerObjectClass(coupon, StripeCoupon);
  DataClassRegistry.registerObjectClass(code, StripeCouponCode);
});

describe("stripe coupon models", () => {
  it("rehydrates redeemBy into a Date and reads the included codes", () => {
    const coupon = new StripeCoupon().rehydrate({
      jsonApi: {
        id: "co-1",
        type: "stripe-coupons",
        attributes: {
          stripeCouponId: "co_1",
          name: "Founding GM",
          discountType: "percent_off",
          percentOff: 20,
          duration: "forever",
          redeemBy: "2027-01-01T00:00:00.000Z",
          maxRedemptions: 50,
          timesRedeemed: 13,
          valid: true,
        },
        relationships: { codes: { data: [{ type: "stripe-coupon-codes", id: "cc-1" }] } },
      },
      included: [
        {
          id: "cc-1",
          type: "stripe-coupon-codes",
          attributes: {
            stripePromotionCodeId: "promo_1",
            code: "FOUNDER",
            active: true,
            automatic: true,
            expiresAt: "2027-02-01T00:00:00.000Z",
            timesRedeemed: 13,
          },
        },
      ],
    } as any);

    expect(coupon.redeemBy).toBeInstanceOf(Date);
    expect(coupon.redeemBy?.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(coupon.codes.length).toBe(1);
    expect(coupon.codes[0].code).toBe("FOUNDER");
    expect(coupon.codes[0].expiresAt).toBeInstanceOf(Date);
    expect(coupon.timesRedeemed).toBe(13);
  });

  it("serialises the datetimes of the coupon and its first code as ISO strings", () => {
    const body = new StripeCoupon().createJsonApi({
      id: "co-1",
      name: "Founding GM",
      discountType: "percent_off",
      percentOff: 20,
      duration: "forever",
      productIds: ["p1"],
      redeemBy: new Date("2027-01-01T00:00:00.000Z"),
      maxRedemptions: 50,
      firstCode: { code: "FOUNDER", automatic: true, expiresAt: new Date("2027-02-01T00:00:00.000Z") },
    });

    expect(body.data.type).toBe("stripe-coupons");
    expect(body.data.attributes.redeemBy).toBe("2027-01-01T00:00:00.000Z");
    expect(body.data.attributes.firstCode.expiresAt).toBe("2027-02-01T00:00:00.000Z");
    expect(body.data.attributes.firstCode.automatic).toBe(true);
    expect(body.data.attributes.productIds).toEqual(["p1"]);
    expect("amountOff" in body.data.attributes).toBe(false);
  });

  it("builds the rename body with the name only", () => {
    expect(new StripeCoupon().createRenameJsonApi({ id: "co-1", name: "Renamed" })).toEqual({
      data: { type: "stripe-coupons", id: "co-1", attributes: { name: "Renamed" } },
    });
  });

  it("writes the code's coupon relationship", () => {
    const body = new StripeCouponCode().createJsonApi({ id: "c1", couponId: "co-1", code: "SPRING" });
    expect(body.data.type).toBe("stripe-coupon-codes");
    expect(body.data.attributes).toEqual({ code: "SPRING" });
    expect(body.data.relationships.coupon).toEqual({ data: { type: "stripe-coupons", id: "co-1" } });
  });

  it("builds the flags body with only the flags that are set", () => {
    const body = new StripeCouponCode().createFlagsJsonApi({ id: "c1", automatic: true });
    expect(body).toEqual({ data: { type: "stripe-coupon-codes", id: "c1", attributes: { automatic: true } } });
    expect("active" in body.data.attributes).toBe(false);
  });
});
