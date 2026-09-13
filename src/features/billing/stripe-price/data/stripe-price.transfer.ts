import { z } from "zod";
import { StripePriceInterface } from "./stripe-price.interface";

// ============================================================================
// Stripe Price Transfer Document
// ----------------------------------------------------------------------------
// Pure, DOM-free: no React, no window, no Blob, no fetch. Everything here is a
// plain data transformation so it can be unit-tested without a renderer, and so
// both the export (download) and the clone (prefill an editor) paths can share
// one definition of "the editable shape of a price".
// ============================================================================

export const STRIPE_PRICE_TRANSFER_KIND = "stripe-price";
export const STRIPE_PRICE_TRANSFER_VERSION = 1;

/** Versions this build can still read. Older documents stay parseable here. */
const SUPPORTED_VERSIONS: number[] = [STRIPE_PRICE_TRANSFER_VERSION];

/** The editable shape of a price, portable between environments. */
export type StripePriceSeed = {
  unitAmount: number; // MINOR units (cents), exactly as Stripe stores it
  currency: string;
  interval: "one_time" | "day" | "week" | "month" | "year";
  intervalCount?: number;
  usageType?: "licensed" | "metered";
  nickname?: string;
  description?: string;
  features?: string[]; // free-text marketing bullets
  token?: number;
  isTrial?: boolean;
  platformFeatures?: string[]; // Feature entity NAMES (never ids — ids differ per environment)
};

export type StripePriceTransferDocument = {
  kind: typeof STRIPE_PRICE_TRANSFER_KIND;
  version: typeof STRIPE_PRICE_TRANSFER_VERSION;
  price: StripePriceSeed;
};

const seedSchema = z.object({
  unitAmount: z.number().min(0),
  currency: z.string().min(1),
  interval: z.enum(["one_time", "day", "week", "month", "year"]),
  intervalCount: z.number().min(1).optional(),
  usageType: z.enum(["licensed", "metered"]).optional(),
  nickname: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  token: z.number().optional(),
  isTrial: z.boolean().optional(),
  platformFeatures: z.array(z.string()).optional(),
});

/**
 * `currency` and `priceType` are getters that THROW when the attribute is
 * absent (stripe-price.ts:42-58), and `productId` demonstrably is absent on a
 * hydrated price (see the note in PriceEditor). Read anything model-backed
 * through here so a partially-hydrated price degrades to a default instead of
 * exploding mid-export.
 */
function readOptional<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

function nonEmptyStrings(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

/**
 * Clone path: a live price -> the editable seed.
 *
 * Carries NO identity: no id, no stripePriceId, no productId, no active, no
 * lookupKey, no metadata. A clone is a brand-new Stripe price and Stripe mints
 * its own id on create; copying any of those across would either collide or
 * silently re-point the new price at the source environment's objects.
 */
export function priceToSeed(price: StripePriceInterface): StripePriceSeed {
  const priceType = readOptional(() => price.priceType);
  const currency = readOptional(() => price.currency);
  const recurring = price.recurring;

  // Same derivation as PriceEditor's getDefaultValues, so a cloned seed and the
  // form it prefills never disagree about what interval a price has.
  const interval: StripePriceSeed["interval"] =
    priceType === "one_time" ? "one_time" : (recurring?.interval ?? "month");

  // MINOR units on purpose. PriceEditor divides by 100 for display; the
  // document stays in the unit Stripe itself stores.
  const seed: StripePriceSeed = {
    unitAmount: price.unitAmount ?? 0,
    currency: currency ?? "usd",
    interval,
  };

  if (interval !== "one_time") {
    if (typeof recurring?.intervalCount === "number") seed.intervalCount = recurring.intervalCount;
    if (recurring?.usageType) seed.usageType = recurring.usageType;
  }

  const nickname = price.nickname?.trim();
  if (nickname) seed.nickname = nickname;

  const description = price.description?.trim();
  if (description) seed.description = description;

  const features = nonEmptyStrings(price.features);
  if (features.length > 0) seed.features = features;

  // `0` is a meaningful token value ("no AI"), so test for the type, never for
  // truthiness.
  if (typeof price.token === "number" && !Number.isNaN(price.token)) seed.token = price.token;

  if (typeof price.isTrial === "boolean") seed.isTrial = price.isTrial;

  // NAMES, never ids: Feature ids differ per environment, names are the stable
  // handle an importing environment can resolve against its own Feature rows.
  const platformFeatures = nonEmptyStrings(price.priceFeatures?.map((feature) => feature.name));
  if (platformFeatures.length > 0) seed.platformFeatures = platformFeatures;

  return seed;
}

/** Export path. */
export function buildStripePriceTransferDocument(price: StripePriceInterface): StripePriceTransferDocument {
  return {
    kind: STRIPE_PRICE_TRANSFER_KIND,
    version: STRIPE_PRICE_TRANSFER_VERSION,
    price: priceToSeed(price),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Export path: a safe download filename, e.g. "price-standard.json". */
export function stripePriceTransferFilename(price: StripePriceInterface): string {
  const seed = priceToSeed(price);
  const fromNickname = seed.nickname ? slugify(seed.nickname) : "";
  // Fallback keeps two exports of different prices from colliding when neither
  // is nicknamed. Both halves are slugified, so no separator can survive.
  const slug = fromNickname || slugify(`${seed.unitAmount}-${seed.currency}`);

  return `price-${slug || "export"}.json`;
}

/** Import path. Throws an Error when the text is not a valid document. */
export function parseStripePriceTransferDocument(raw: string): StripePriceTransferDocument {
  let candidate: unknown;
  try {
    candidate = JSON.parse(raw);
  } catch {
    throw new Error("The file is not valid JSON.");
  }

  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate))
    throw new Error("The file is not a price transfer document.");

  const document = candidate as Record<string, unknown>;

  if (document.kind !== STRIPE_PRICE_TRANSFER_KIND)
    throw new Error(
      `The file is not a price transfer document: expected kind "${STRIPE_PRICE_TRANSFER_KIND}", found ${JSON.stringify(document.kind)}.`,
    );

  if (typeof document.version !== "number" || !SUPPORTED_VERSIONS.includes(document.version))
    throw new Error(
      `Unsupported price transfer version ${JSON.stringify(document.version)}. Supported: ${SUPPORTED_VERSIONS.join(", ")}.`,
    );

  // Unknown keys are stripped rather than rejected, so a document written by a
  // newer build of the same version still imports.
  const parsed = seedSchema.safeParse(document.price);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "price"}: ${issue.message}`)
      .join("; ");
    throw new Error(`The price in the file is not valid. ${details}`);
  }

  return {
    kind: STRIPE_PRICE_TRANSFER_KIND,
    version: STRIPE_PRICE_TRANSFER_VERSION,
    price: parsed.data,
  };
}
