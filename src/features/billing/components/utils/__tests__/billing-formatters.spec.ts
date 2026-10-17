import { describe, expect, it } from "vitest";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { formatCurrency, formatFixed, formatInterval } from "../currency";
import { formatDate } from "../date";

const price = (recurring?: { interval: string; intervalCount: number }, priceType = "recurring") =>
  ({ priceType, recurring }) as unknown as StripePriceInterface;

/** Echoes the key and values so a test can see exactly what was asked for. */
const t = (key: string, values?: Record<string, any>) => (values ? `${key}|${JSON.stringify(values)}` : key);

describe("formatInterval", () => {
  it("keeps the English output when no translator is passed", () => {
    expect(formatInterval(price(undefined, "one_time"))).toBe("one-time");
    expect(formatInterval(price({ interval: "month", intervalCount: 1 }))).toBe("/month");
    expect(formatInterval(price({ interval: "week", intervalCount: 2 }))).toBe("/2 weeks");
  });

  it("asks the translator for every word it emits", () => {
    expect(formatInterval(price(undefined, "one_time"), { t })).toBe("billing.ui.interval.one_time");
    expect(formatInterval(price({ interval: "day", intervalCount: 1 }), { t })).toBe("billing.ui.interval.per_day");
    expect(formatInterval(price({ interval: "year", intervalCount: 1 }), { t })).toBe("billing.ui.interval.per_year");
    expect(formatInterval(price({ interval: "month", intervalCount: 3 }), { t })).toBe(
      'billing.ui.interval.per_months|{"count":3}',
    );
  });
});

describe("formatCurrency", () => {
  it("keeps the en-US output and the $0.00 literal without a locale", () => {
    expect(formatCurrency(999, "usd")).toBe("$9.99");
    expect(formatCurrency(undefined, "usd")).toBe("$0.00");
  });

  it("formats with the given locale", () => {
    expect(formatCurrency(999, "eur", { locale: "it" })).toMatch(/^9,99\s€$/);
    expect(formatCurrency(undefined, "eur", { locale: "it" })).toMatch(/^0,00\s€$/);
  });
});

describe("formatDate", () => {
  const date = new Date(2025, 0, 15, 12);

  it("keeps the English output without options", () => {
    expect(formatDate(date)).toBe("Jan 15, 2025");
    expect(formatDate(undefined)).toBe("N/A");
    expect(formatDate(new Date("not a date"))).toBe("Invalid Date");
  });

  it("uses the locale and the translator when given", () => {
    expect(formatDate(date, { locale: "it", t })).toBe("15 gen 2025");
    expect(formatDate(undefined, { locale: "it", t })).toBe("billing.ui.not_available");
    expect(formatDate(new Date("not a date"), { locale: "it", t })).toBe("billing.ui.invalid_date");
  });
});

describe("formatFixed", () => {
  it("matches toFixed in English and uses the locale's decimal separator otherwise", () => {
    expect(formatFixed(12.345, "en", 1)).toBe((12.345).toFixed(1));
    expect(formatFixed(1234.5, "en", 1)).toBe("1234.5");
    expect(formatFixed(12.5, "it", 1)).toBe("12,5");
  });
});
