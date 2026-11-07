import { describe, expect, it } from "vitest";
import { createUsageFormatters } from "../formatters";

describe("createUsageFormatters.compact", () => {
  const { compact } = createUsageFormatters("en-US", "EUR");

  it("keeps sub-unit axis ticks distinct", () => {
    const ticks = [0, 0.05, 0.1, 0.15, 0.2, 0.25];
    const labels = ticks.map(compact);
    expect(labels).toEqual(["0", "0.05", "0.1", "0.15", "0.2", "0.25"]);
    expect(new Set(labels).size).toBe(ticks.length);
  });

  it("keeps thousands ticks distinct and exact", () => {
    expect([0, 250, 500, 750, 1000, 1250].map(compact)).toEqual(["0", "250", "500", "750", "1K", "1.25K"]);
  });

  it("still abbreviates large values", () => {
    expect(compact(1500000)).toBe("1.5M");
  });
});

describe("createUsageFormatters.bucketDate dateLocale", () => {
  it("formats day buckets with the date locale", () => {
    expect(createUsageFormatters("en", "EUR", "en-GB").bucketDate("2026-04-25", "day")).toBe("25 Apr");
  });

  it("defaults the date locale to the number locale", () => {
    expect(createUsageFormatters("en", "EUR").bucketDate("2026-04-25", "day")).toBe("Apr 25");
  });

  it("keeps number output identical between the two", () => {
    const withDateLocale = createUsageFormatters("en", "EUR", "en-GB");
    const withoutDateLocale = createUsageFormatters("en", "EUR");
    for (const value of [0, 0.05, 1250, 1500000]) {
      expect(withDateLocale.compact(value)).toBe(withoutDateLocale.compact(value));
      expect(withDateLocale.decimal(value, 2)).toBe(withoutDateLocale.decimal(value, 2));
    }
  });
});
