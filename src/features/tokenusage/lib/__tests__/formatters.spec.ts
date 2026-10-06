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
