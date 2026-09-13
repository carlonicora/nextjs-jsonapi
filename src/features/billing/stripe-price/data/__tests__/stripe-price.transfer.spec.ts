import { describe, expect, it } from "vitest";
import { StripePriceInterface } from "../stripe-price.interface";
import {
  STRIPE_PRICE_TRANSFER_KIND,
  STRIPE_PRICE_TRANSFER_VERSION,
  buildStripePriceTransferDocument,
  parseStripePriceTransferDocument,
  priceToSeed,
  stripePriceTransferFilename,
} from "../stripe-price.transfer";

// A plain object, never the real model: the model's `currency` / `priceType`
// getters throw when the attribute is absent, and the point of these tests is
// the transformation, not the hydration.
const makePrice = (overrides: Partial<Record<keyof StripePriceInterface, unknown>> = {}): StripePriceInterface =>
  ({
    id: "price-node-1",
    stripePriceId: "price_1SourceEnv",
    productId: "product-node-1",
    active: true,
    currency: "eur",
    unitAmount: 5900,
    priceType: "recurring",
    recurring: { interval: "month", intervalCount: 1, usageType: "licensed" },
    nickname: "Standard",
    lookupKey: "standard_monthly",
    metadata: { env: "production" },
    description: "The standard plan",
    features: ["Unlimited projects", "Priority support"],
    token: 1000,
    isTrial: false,
    priceFeatures: [{ id: "feature-node-9", name: "AI assistant" }],
    ...overrides,
  }) as unknown as StripePriceInterface;

describe("stripe-price.transfer", () => {
  describe("priceToSeed", () => {
    it("carries no identity across environments", () => {
      const seed = priceToSeed(makePrice());

      expect(seed).not.toHaveProperty("id");
      expect(seed).not.toHaveProperty("stripePriceId");
      expect(seed).not.toHaveProperty("productId");
      expect(seed).not.toHaveProperty("active");
      expect(seed).not.toHaveProperty("lookupKey");
      expect(seed).not.toHaveProperty("metadata");
    });

    it("keeps unitAmount in minor units", () => {
      expect(priceToSeed(makePrice({ unitAmount: 5900 })).unitAmount).toBe(5900);
    });

    it("defaults a missing unitAmount to 0", () => {
      expect(priceToSeed(makePrice({ unitAmount: undefined })).unitAmount).toBe(0);
    });

    it("exports platform features by NAME, never by id", () => {
      const seed = priceToSeed(
        makePrice({
          priceFeatures: [
            { id: "feature-node-9", name: "AI assistant" },
            { id: "feature-node-3", name: "Custom domains" },
          ],
        }),
      );

      expect(seed.platformFeatures).toEqual(["AI assistant", "Custom domains"]);
    });

    it("omits platformFeatures entirely when the price has none", () => {
      const seed = priceToSeed(makePrice({ priceFeatures: [] }));

      expect(seed).not.toHaveProperty("platformFeatures");
    });

    it("exports interval 'one_time' for a one-time price", () => {
      const seed = priceToSeed(makePrice({ priceType: "one_time", recurring: undefined }));

      expect(seed.interval).toBe("one_time");
      expect(seed).not.toHaveProperty("intervalCount");
      expect(seed).not.toHaveProperty("usageType");
    });

    it("falls back to a monthly interval when a recurring price has no recurring block", () => {
      const seed = priceToSeed(makePrice({ priceType: "recurring", recurring: undefined }));

      expect(seed.interval).toBe("month");
    });

    it("keeps a token of 0, which means 'no AI' rather than 'unset'", () => {
      expect(priceToSeed(makePrice({ token: 0 })).token).toBe(0);
    });

    it("omits optional keys instead of writing undefined", () => {
      const seed = priceToSeed(
        makePrice({
          nickname: undefined,
          description: "",
          features: [],
          token: undefined,
          isTrial: undefined,
        }),
      );

      expect(Object.keys(seed).sort()).toEqual(
        ["currency", "interval", "intervalCount", "platformFeatures", "unitAmount", "usageType"].sort(),
      );
      expect(JSON.stringify(seed)).not.toContain("undefined");
    });

    it("survives a model whose currency and priceType getters throw", () => {
      const throwing = {
        get currency(): string {
          throw new Error("currency is not defined");
        },
        get priceType(): "one_time" | "recurring" {
          throw new Error("priceType is not defined");
        },
        unitAmount: 1500,
        recurring: { interval: "year", intervalCount: 1 },
        priceFeatures: [],
      } as unknown as StripePriceInterface;

      expect(priceToSeed(throwing)).toEqual({ unitAmount: 1500, currency: "usd", interval: "year", intervalCount: 1 });
    });
  });

  describe("buildStripePriceTransferDocument", () => {
    it("round-trips through JSON unchanged", () => {
      const document = buildStripePriceTransferDocument(makePrice());

      const parsed = parseStripePriceTransferDocument(JSON.stringify(document));

      expect(parsed).toEqual(document);
      expect(parsed.price).toEqual(document.price);
      expect(parsed.kind).toBe(STRIPE_PRICE_TRANSFER_KIND);
      expect(parsed.version).toBe(STRIPE_PRICE_TRANSFER_VERSION);
    });

    it("serialises no identity at all", () => {
      const serialised = JSON.stringify(buildStripePriceTransferDocument(makePrice()));

      expect(serialised).not.toContain("stripePriceId");
      expect(serialised).not.toContain("price_1SourceEnv");
      expect(serialised).not.toContain("productId");
      expect(serialised).not.toContain("product-node-1");
      expect(serialised).not.toContain("price-node-1");
      expect(serialised).not.toContain("feature-node-9");
      expect(serialised).not.toContain("lookupKey");
      expect(serialised).not.toContain("metadata");
      expect(serialised).not.toMatch(/"id"/);
    });
  });

  describe("stripePriceTransferFilename", () => {
    it("slugs the nickname", () => {
      expect(stripePriceTransferFilename(makePrice({ nickname: "Standard" }))).toBe("price-standard.json");
    });

    it("collapses non-alphanumerics and trims the edges", () => {
      expect(stripePriceTransferFilename(makePrice({ nickname: "  Pro // Yearly (EU)!  " }))).toBe(
        "price-pro-yearly-eu.json",
      );
    });

    it("falls back to amount and currency without a nickname", () => {
      expect(stripePriceTransferFilename(makePrice({ nickname: undefined, unitAmount: 5900, currency: "eur" }))).toBe(
        "price-5900-eur.json",
      );
    });

    it("never emits a path separator", () => {
      const filename = stripePriceTransferFilename(makePrice({ nickname: "../../etc/passwd" }));

      expect(filename).not.toContain("/");
      expect(filename).not.toContain("\\");
      expect(filename).toBe("price-etc-passwd.json");
    });
  });

  describe("parseStripePriceTransferDocument", () => {
    const validDocument = () => ({
      kind: STRIPE_PRICE_TRANSFER_KIND,
      version: STRIPE_PRICE_TRANSFER_VERSION,
      price: { unitAmount: 5900, currency: "eur", interval: "month" },
    });

    it("rejects text that is not JSON", () => {
      expect(() => parseStripePriceTransferDocument("not json at all")).toThrow(/not valid JSON/i);
    });

    it("rejects a wrong kind", () => {
      const raw = JSON.stringify({ ...validDocument(), kind: "stripe-product" });

      expect(() => parseStripePriceTransferDocument(raw)).toThrow(/kind/i);
    });

    it("rejects a future version", () => {
      const raw = JSON.stringify({ ...validDocument(), version: 99 });

      expect(() => parseStripePriceTransferDocument(raw)).toThrow(/version/i);
    });

    it("rejects a missing unitAmount", () => {
      const raw = JSON.stringify({ ...validDocument(), price: { currency: "eur", interval: "month" } });

      expect(() => parseStripePriceTransferDocument(raw)).toThrow(/unitAmount/);
    });

    it("rejects a negative unitAmount and an unknown interval", () => {
      expect(() =>
        parseStripePriceTransferDocument(
          JSON.stringify({ ...validDocument(), price: { unitAmount: -1, currency: "eur", interval: "month" } }),
        ),
      ).toThrow(/unitAmount/);

      expect(() =>
        parseStripePriceTransferDocument(
          JSON.stringify({ ...validDocument(), price: { unitAmount: 100, currency: "eur", interval: "fortnight" } }),
        ),
      ).toThrow(/interval/);
    });

    it("strips unknown keys instead of failing on them", () => {
      const raw = JSON.stringify({
        ...validDocument(),
        price: {
          unitAmount: 5900,
          currency: "eur",
          interval: "month",
          stripePriceId: "price_1OtherEnv",
          productId: "product-node-2",
          id: "price-node-2",
        },
      });

      const parsed = parseStripePriceTransferDocument(raw);

      expect(parsed.price).toEqual({ unitAmount: 5900, currency: "eur", interval: "month" });
      expect(parsed.price).not.toHaveProperty("stripePriceId");
      expect(parsed.price).not.toHaveProperty("productId");
      expect(parsed.price).not.toHaveProperty("id");
    });

    it("keeps every optional key it recognises", () => {
      const price = {
        unitAmount: 5900,
        currency: "eur",
        interval: "year",
        intervalCount: 2,
        usageType: "metered",
        nickname: "Standard",
        description: "The standard plan",
        features: ["Unlimited projects"],
        token: 0,
        isTrial: true,
        platformFeatures: ["AI assistant"],
      };

      const parsed = parseStripePriceTransferDocument(JSON.stringify({ ...validDocument(), price }));

      expect(parsed.price).toEqual(price);
    });
  });
});
