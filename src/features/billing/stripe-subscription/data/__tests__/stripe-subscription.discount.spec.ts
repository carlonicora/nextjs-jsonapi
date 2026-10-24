import { beforeAll, describe, expect, it } from "vitest";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../../permissions/types";
import { StripePriceModule } from "../../../stripe-price/stripe-price.module";
import { StripeSubscription } from "../stripe-subscription";

// rehydrate reads Modules.StripePrice for the price relationship, so the module must be registered.
const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

beforeAll(() => {
  ModuleRegistry.register("StripePrice", StripePriceModule(moduleFactory));
});

const subscriptionWith = (attributes: Record<string, unknown>) =>
  new StripeSubscription().rehydrate({
    jsonApi: {
      id: "sub-1",
      type: "stripe-subscriptions",
      attributes: {
        stripeSubscriptionId: "sub_1",
        status: "active",
        currentPeriodStart: "2026-10-01T00:00:00.000Z",
        currentPeriodEnd: "2026-11-01T00:00:00.000Z",
        ...attributes,
      },
    },
    included: [],
  });

describe("StripeSubscription discount", () => {
  it("rehydrates a percentage discount that lasts forever", () => {
    const subscription = subscriptionWith({ discountPercentOff: 20, discountDuration: "forever" });

    expect(subscription.discount).toEqual({
      percentOff: 20,
      amountOff: undefined,
      currency: undefined,
      duration: "forever",
      durationInMonths: undefined,
      end: undefined,
    });
  });

  it("rehydrates a repeating amount discount with its end as a Date", () => {
    const subscription = subscriptionWith({
      discountAmountOff: 200,
      discountCurrency: "eur",
      discountDuration: "repeating",
      discountDurationInMonths: 3,
      discountEnd: "2027-01-01T00:00:00.000Z",
    });

    expect(subscription.discount?.amountOff).toBe(200);
    expect(subscription.discount?.currency).toBe("eur");
    expect(subscription.discount?.durationInMonths).toBe(3);
    expect(subscription.discount?.end).toEqual(new Date("2027-01-01T00:00:00.000Z"));
  });

  it("has no discount when the API sends none", () => {
    expect(subscriptionWith({}).discount).toBeUndefined();
  });

  it("has no discount when the duration comes without an amount", () => {
    expect(subscriptionWith({ discountDuration: "forever" }).discount).toBeUndefined();
  });
});
