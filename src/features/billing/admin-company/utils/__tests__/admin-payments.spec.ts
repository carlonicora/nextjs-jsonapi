import { describe, expect, it } from "vitest";
import { StripeInvoiceInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeSubscriptionInterface } from "../../../stripe-subscription/data/stripe-subscription.interface";
import { AdminPaymentRow, buildAdminPayments, totalsByCurrency } from "../admin-payments";

const PAID_AT = new Date("2026-08-14T10:00:00.000Z");
const PERIOD_START = new Date("2026-08-01T00:00:00.000Z");
const SERVICE_START = new Date("2026-08-14T00:00:00.000Z");
const SERVICE_END = new Date("2027-08-14T00:00:00.000Z");

function price(params: {
  priceType?: "recurring" | "one_time";
  interval?: "month" | "year";
  intervalCount?: number;
  nickname?: string;
  productName?: string;
  unitAmount?: number;
  currency?: string;
}): StripePriceInterface {
  const priceType = params.priceType ?? "recurring";
  return {
    priceType,
    recurring:
      priceType === "recurring"
        ? { interval: params.interval ?? "month", intervalCount: params.intervalCount ?? 1 }
        : undefined,
    nickname: params.nickname,
    product: params.productName ? { name: params.productName } : undefined,
    unitAmount: params.unitAmount,
    currency: params.currency ?? "eur",
  } as unknown as StripePriceInterface;
}

function invoice(params: {
  id?: string;
  status?: string;
  attemptCount?: number;
  amountPaid?: number;
  amountDue?: number;
  currency?: string;
  paidAt?: Date;
  periodStart?: Date;
  stripePrice?: StripePriceInterface;
  forSubscription?: boolean;
  servicePeriodStart?: Date;
  servicePeriodEnd?: Date;
}): StripeInvoiceInterface {
  return {
    id: params.id ?? "inv-1",
    status: params.status ?? "paid",
    attemptCount: params.attemptCount ?? 0,
    amountPaid: params.amountPaid ?? 900,
    amountDue: params.amountDue ?? 900,
    currency: params.currency ?? "eur",
    paidAt: params.paidAt,
    get periodStart(): Date {
      if (!params.periodStart) throw new Error("periodStart is not defined");
      return params.periodStart;
    },
    stripePrice: params.stripePrice,
    forSubscription: params.forSubscription,
    servicePeriodStart: params.servicePeriodStart,
    servicePeriodEnd: params.servicePeriodEnd,
  } as unknown as StripeInvoiceInterface;
}

function purchase(params: {
  id?: string;
  start?: Date;
  price?: StripePriceInterface;
  quantity?: number;
}): StripeSubscriptionInterface {
  return {
    id: params.id ?? "pi-1",
    get currentPeriodStart(): Date {
      if (!params.start) throw new Error("currentPeriodStart is not defined");
      return params.start;
    },
    price: params.price,
    quantity: params.quantity,
  } as unknown as StripeSubscriptionInterface;
}

function only(invoices: StripeInvoiceInterface[]): AdminPaymentRow {
  const rows = buildAdminPayments(invoices, []);
  expect(rows).toHaveLength(1);
  return rows[0]!;
}

describe("buildAdminPayments: For", () => {
  it("a monthly price gives monthly", () => {
    expect(only([invoice({ paidAt: PAID_AT, stripePrice: price({ interval: "month" }) })]).forKey).toBe("monthly");
  });

  it("a yearly price gives yearly", () => {
    expect(only([invoice({ paidAt: PAID_AT, stripePrice: price({ interval: "year" }) })]).forKey).toBe("yearly");
  });

  it("a price every 3 months gives other with the nickname", () => {
    const row = only([
      invoice({ paidAt: PAID_AT, stripePrice: price({ interval: "month", intervalCount: 3, nickname: "Quarterly" }) }),
    ]);
    expect(row.forKey).toBe("other");
    expect(row.forName).toBe("Quarterly");
  });

  it("other falls back to the product name without a nickname", () => {
    const row = only([
      invoice({ paidAt: PAID_AT, stripePrice: price({ interval: "year", intervalCount: 2, productName: "Pro" }) }),
    ]);
    expect(row.forKey).toBe("other");
    expect(row.forName).toBe("Pro");
  });

  it("a one-time price gives one_time", () => {
    expect(only([invoice({ paidAt: PAID_AT, stripePrice: price({ priceType: "one_time" }) })]).forKey).toBe("one_time");
  });

  it("no price and no subscription gives one_time", () => {
    expect(only([invoice({ paidAt: PAID_AT, forSubscription: false })]).forKey).toBe("one_time");
  });

  it("no price but a subscription gives unknown", () => {
    expect(only([invoice({ paidAt: PAID_AT, forSubscription: true })]).forKey).toBe("unknown");
  });
});

describe("buildAdminPayments: Status and Amount", () => {
  it("an attempted open invoice is failed", () => {
    expect(only([invoice({ status: "open", attemptCount: 1, periodStart: PERIOD_START })]).status).toBe("failed");
  });

  it("an attempted uncollectible invoice is failed", () => {
    expect(only([invoice({ status: "uncollectible", attemptCount: 1, periodStart: PERIOD_START })]).status).toBe(
      "failed",
    );
  });

  it("an open invoice never attempted stays open", () => {
    expect(only([invoice({ status: "open", attemptCount: 0, periodStart: PERIOD_START })]).status).toBe("open");
  });

  it("a paid invoice shows the paid amount", () => {
    expect(only([invoice({ status: "paid", amountPaid: 5900, amountDue: 6000, paidAt: PAID_AT })]).amount).toBe(5900);
  });

  it("an unpaid invoice shows the due amount", () => {
    expect(only([invoice({ status: "open", amountPaid: 0, amountDue: 900, periodStart: PERIOD_START })]).amount).toBe(
      900,
    );
  });

  it("drafts are left out", () => {
    expect(buildAdminPayments([invoice({ status: "draft", periodStart: PERIOD_START })], [])).toEqual([]);
  });
});

describe("buildAdminPayments: Date and Period", () => {
  it("an invoice row is dated paidAt", () => {
    expect(only([invoice({ paidAt: PAID_AT, periodStart: PERIOD_START })]).date).toEqual(PAID_AT);
  });

  it("an unpaid invoice row is dated periodStart", () => {
    expect(only([invoice({ status: "open", periodStart: PERIOD_START })]).date).toEqual(PERIOD_START);
  });

  it("carries the recorded covered period and the invoice", () => {
    const source = invoice({
      paidAt: PAID_AT,
      stripePrice: price({ interval: "year" }),
      servicePeriodStart: SERVICE_START,
      servicePeriodEnd: SERVICE_END,
    });
    const row = only([source]);
    expect(row.periodStart).toEqual(SERVICE_START);
    expect(row.periodEnd).toEqual(SERVICE_END);
    expect(row.invoice).toBe(source);
  });
});

describe("buildAdminPayments: old extra-page purchases", () => {
  it("is a paid one-time row dated currentPeriodStart, amount price × quantity", () => {
    const rows = buildAdminPayments(
      [],
      [purchase({ id: "pi-9", start: PAID_AT, price: price({ priceType: "one_time", unitAmount: 500 }), quantity: 2 })],
    );
    expect(rows).toEqual([
      {
        id: "pi-9",
        date: PAID_AT,
        forKey: "one_time",
        status: "paid",
        amount: 1000,
        currency: "eur",
      },
    ]);
  });

  it("quantity defaults to 1", () => {
    const [row] = buildAdminPayments(
      [],
      [purchase({ start: PAID_AT, price: price({ priceType: "one_time", unitAmount: 500, currency: "usd" }) })],
    );
    expect(row!.amount).toBe(500);
    expect(row!.currency).toBe("usd");
  });

  it("without a price the amount is undefined", () => {
    const [row] = buildAdminPayments([], [purchase({ start: PAID_AT })]);
    expect(row!.amount).toBeUndefined();
    expect(row!.invoice).toBeUndefined();
  });
});

describe("buildAdminPayments: order", () => {
  it("merges both sources newest first", () => {
    const rows = buildAdminPayments(
      [
        invoice({ id: "inv-old", paidAt: new Date("2026-06-14T00:00:00Z") }),
        invoice({ id: "inv-new", paidAt: new Date("2026-08-14T00:00:00Z") }),
      ],
      [purchase({ id: "pi-mid", start: new Date("2026-07-01T00:00:00Z") })],
    );
    expect(rows.map((row) => row.id)).toEqual(["inv-new", "pi-mid", "inv-old"]);
  });
});

describe("totalsByCurrency", () => {
  const row = (params: Partial<AdminPaymentRow>): AdminPaymentRow => ({
    id: "x",
    date: PAID_AT,
    forKey: "monthly",
    status: "paid",
    amount: 100,
    currency: "eur",
    ...params,
  });

  it("sums paid rows per currency, eur first then alphabetical", () => {
    expect(
      totalsByCurrency([
        row({ amount: 900, currency: "usd" }),
        row({ amount: 5900 }),
        row({ amount: 300, currency: "gbp" }),
        row({ amount: 900 }),
        row({ amount: 100, currency: "chf" }),
      ]),
    ).toEqual([
      { currency: "eur", amount: 6800 },
      { currency: "chf", amount: 100 },
      { currency: "gbp", amount: 300 },
      { currency: "usd", amount: 900 },
    ]);
  });

  it("skips unpaid rows and rows without an amount", () => {
    expect(
      totalsByCurrency([
        row({ status: "failed", amount: 900 }),
        row({ status: "open", amount: 900 }),
        row({ forKey: "one_time", amount: undefined, currency: undefined }),
        row({ amount: 500 }),
      ]),
    ).toEqual([{ currency: "eur", amount: 500 }]);
  });

  it("gives nothing for no rows", () => {
    expect(totalsByCurrency([])).toEqual([]);
  });
});
