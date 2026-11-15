import { beforeAll, describe, expect, it } from "vitest";
import { DataClassRegistry } from "../../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../../permissions/types";
import { FeatureModule } from "../../../../feature/feature.module";
import { StripePrice } from "../../../stripe-price/data/stripe-price";
import { StripePriceModule } from "../../../stripe-price/stripe-price.module";
import { StripeProductModule } from "../../../stripe-product/stripe-product.module";
import { StripeSubscriptionModule } from "../../../stripe-subscription/stripe-subscription.module";
import { StripeInvoice } from "../stripe-invoice";

// rehydrate reads Modules.StripePrice and Modules.StripeSubscription (the price's own rehydrate
// reads StripeProduct and Feature), so those modules and the price class are registered.
const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

beforeAll(() => {
  const priceModule = StripePriceModule(moduleFactory);
  ModuleRegistry.register("StripePrice", priceModule);
  ModuleRegistry.register("StripeProduct", StripeProductModule(moduleFactory));
  ModuleRegistry.register("StripeSubscription", StripeSubscriptionModule(moduleFactory));
  ModuleRegistry.register("Feature", FeatureModule(moduleFactory));
  DataClassRegistry.registerObjectClass(priceModule, StripePrice);
});

const baseAttributes = {
  stripeInvoiceId: "in_1",
  status: "paid",
  amountDue: 5900,
  amountPaid: 5900,
  amountRemaining: 0,
  subtotal: 5900,
  total: 5900,
  currency: "eur",
  periodStart: "2026-08-14T00:00:00.000Z",
  periodEnd: "2026-08-14T00:00:00.000Z",
};

describe("StripeInvoice", () => {
  it("reads the covered period as dates, forSubscription and the recorded price", () => {
    const invoice = new StripeInvoice().rehydrate({
      jsonApi: {
        id: "inv-1",
        type: "stripe-invoices",
        attributes: {
          ...baseAttributes,
          servicePeriodStart: "2026-08-14T00:00:00.000Z",
          servicePeriodEnd: "2027-08-14T00:00:00.000Z",
          forSubscription: true,
        },
        relationships: { stripePrice: { data: { type: "stripe-prices", id: "price-1" } } },
      },
      included: [
        {
          id: "price-1",
          type: "stripe-prices",
          attributes: {
            stripePriceId: "price_1",
            currency: "eur",
            unitAmount: 5900,
            priceType: "recurring",
            recurringInterval: "year",
          },
        },
      ],
    });

    expect(invoice.servicePeriodStart).toEqual(new Date("2026-08-14T00:00:00.000Z"));
    expect(invoice.servicePeriodEnd).toEqual(new Date("2027-08-14T00:00:00.000Z"));
    expect(invoice.forSubscription).toBe(true);
    expect(invoice.stripePrice?.id).toBe("price-1");
    expect(invoice.stripePrice?.recurring?.interval).toBe("year");
  });

  it("leaves the new fields undefined when the response lacks them", () => {
    const invoice = new StripeInvoice().rehydrate({
      jsonApi: { id: "inv-2", type: "stripe-invoices", attributes: baseAttributes },
      included: [],
    });

    expect(invoice.servicePeriodStart).toBeUndefined();
    expect(invoice.servicePeriodEnd).toBeUndefined();
    expect(invoice.forSubscription).toBeUndefined();
    expect(invoice.stripePrice).toBeUndefined();
    expect(invoice.amountPaid).toBe(5900);
  });
});
