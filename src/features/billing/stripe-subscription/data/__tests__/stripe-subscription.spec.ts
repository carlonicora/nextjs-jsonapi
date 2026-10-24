import { beforeAll, describe, expect, it } from "vitest";
import { DataClassRegistry } from "../../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../../permissions/types";
import { FeatureModule } from "../../../../feature/feature.module";
import { StripeProductModule } from "../../../stripe-product/stripe-product.module";
import { StripePrice } from "../../../stripe-price/data/stripe-price";
import { StripePriceModule } from "../../../stripe-price/stripe-price.module";
import { StripeSubscription } from "../stripe-subscription";

// rehydrate reads Modules.StripePrice (whose own rehydrate reads StripeProduct and Feature), so
// those modules and the price class are registered.
const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

beforeAll(() => {
  const priceModule = StripePriceModule(moduleFactory);
  ModuleRegistry.register("StripePrice", priceModule);
  ModuleRegistry.register("StripeProduct", StripeProductModule(moduleFactory));
  ModuleRegistry.register("Feature", FeatureModule(moduleFactory));
  DataClassRegistry.registerObjectClass(priceModule, StripePrice);
});

const baseAttributes = {
  stripeSubscriptionId: "sub_1",
  status: "active",
  currentPeriodStart: "2026-10-01T00:00:00.000Z",
  currentPeriodEnd: "2026-11-01T00:00:00.000Z",
};

describe("StripeSubscription", () => {
  it("reads the price from the stripePrice relationship", () => {
    const subscription = new StripeSubscription().rehydrate({
      jsonApi: {
        id: "sub-1",
        type: "stripe-subscriptions",
        attributes: baseAttributes,
        relationships: { stripePrice: { data: { type: "stripe-prices", id: "price-1" } } },
      },
      included: [
        {
          id: "price-1",
          type: "stripe-prices",
          attributes: {
            stripePriceId: "price_1",
            currency: "eur",
            unitAmount: 900,
            priceType: "recurring",
            recurringInterval: "month",
          },
        },
      ],
    });

    expect(subscription.price?.id).toBe("price-1");
    expect(subscription.price?.unitAmount).toBe(900);
    expect(subscription.price?.recurring?.interval).toBe("month");
  });
});
