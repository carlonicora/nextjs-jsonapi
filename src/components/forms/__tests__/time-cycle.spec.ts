import { describe, expect, it } from "vitest";
import { dayPeriodLabels, from24Hour, to24Hour } from "../time-cycle";

describe("to24Hour / from24Hour round-trip", () => {
  it("maps 12-hour values around midnight and noon", () => {
    expect(to24Hour(12, "am")).toBe(0);
    expect(to24Hour(12, "pm")).toBe(12);
    expect(to24Hour(11, "pm")).toBe(23);
    expect(to24Hour(1, "am")).toBe(1);
  });

  it("maps 24-hour values to 12-hour values", () => {
    expect(from24Hour(0)).toEqual({ hour12: 12, period: "am" });
    expect(from24Hour(13)).toEqual({ hour12: 1, period: "pm" });
    expect(from24Hour(12)).toEqual({ hour12: 12, period: "pm" });
  });

  it("round-trips every hour of the day", () => {
    for (let hour = 0; hour < 24; hour++) {
      const { hour12, period } = from24Hour(hour);
      expect(to24Hour(hour12, period)).toBe(hour);
    }
  });
});

describe("dayPeriodLabels", () => {
  it("reads the en-US labels from Intl", () => {
    expect(dayPeriodLabels("en-US")).toEqual({ am: "AM", pm: "PM" });
  });

  it("returns two non-empty, different labels for it", () => {
    const labels = dayPeriodLabels("it");
    expect(labels.am.length).toBeGreaterThan(0);
    expect(labels.pm.length).toBeGreaterThan(0);
    expect(labels.am).not.toBe(labels.pm);
  });
});
