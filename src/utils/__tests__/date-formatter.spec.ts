import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DATE_STYLE_OPTIONS,
  dateFormatLocale,
  type DateFormatStyle,
  formatDate,
  formatDateStyle,
  formatRelativeDate,
  PUBLIC_STYLE_MAP,
  resolveDateLocale,
  usesTwelveHourClock,
} from "../date-formatter";

describe("formatDate", () => {
  beforeEach(() => {
    // Mock Date.now to have consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("date format", () => {
    it("should format date only", () => {
      const date = new Date("2024-06-15T10:30:00Z");
      const result = formatDate(date, "date", "en-GB");

      // en-GB format: DD/MM/YYYY
      expect(result).toBe("15/06/2024");
    });

    it("should format date with US locale", () => {
      const date = new Date("2024-06-15T10:30:00Z");
      const result = formatDate(date, "date", "en-US");

      // en-US format: MM/DD/YYYY
      expect(result).toBe("06/15/2024");
    });

    it("should use en-GB as default locale", () => {
      const date = new Date("2024-06-15T10:30:00Z");
      const result = formatDate(date, "date");

      expect(result).toBe("15/06/2024");
    });
  });

  describe("time format", () => {
    it("should format time only", () => {
      const date = new Date("2024-06-15T10:30:00Z");
      const result = formatDate(date, "time", "en-GB");

      // Should include hours and minutes
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe("dateTime format", () => {
    it("should format both date and time", () => {
      const date = new Date("2024-06-15T10:30:00Z");
      const result = formatDate(date, "dateTime", "en-GB");

      // Should contain date and time
      expect(result).toContain("15/06/2024");
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe("timeSince format", () => {
    it("should format seconds ago", () => {
      const date = new Date("2024-06-15T11:59:30Z"); // 30 seconds ago
      const result = formatDate(date, "timeSince");

      expect(result).toBe("30 seconds ago");
    });

    it("should format minutes ago", () => {
      const date = new Date("2024-06-15T11:55:00Z"); // 5 minutes ago
      const result = formatDate(date, "timeSince");

      expect(result).toBe("5 minutes ago");
    });

    it("should format hours ago", () => {
      const date = new Date("2024-06-15T09:00:00Z"); // 3 hours ago
      const result = formatDate(date, "timeSince");

      expect(result).toBe("3 hours ago");
    });

    it("should format days ago", () => {
      const date = new Date("2024-06-13T12:00:00Z"); // 2 days ago
      const result = formatDate(date, "timeSince");

      expect(result).toBe("2 days ago");
    });
  });

  describe("default format", () => {
    it("should use timeSince for dates within 24 hours", () => {
      const date = new Date("2024-06-15T10:00:00Z"); // 2 hours ago
      const result = formatDate(date, "default");

      expect(result).toBe("2 hours ago");
    });

    it("should use dateTime for dates older than 24 hours", () => {
      const date = new Date("2024-06-13T10:00:00Z"); // 2 days + 2 hours ago
      const result = formatDate(date, "default", "en-GB");

      // Should contain date format for older dates
      expect(result).toContain("13/06/2024");
    });
  });

  describe("edge cases", () => {
    it("should handle zero seconds ago", () => {
      const date = new Date("2024-06-15T12:00:00Z"); // exactly now
      const result = formatDate(date, "timeSince");

      expect(result).toBe("0 seconds ago");
    });

    it("should handle 1 minute ago", () => {
      const date = new Date("2024-06-15T11:59:00Z");
      const result = formatDate(date, "timeSince");

      expect(result).toBe("1 minute ago");
    });

    it("should handle 1 hour ago", () => {
      const date = new Date("2024-06-15T11:00:00Z");
      const result = formatDate(date, "timeSince");

      expect(result).toBe("1 hour ago");
    });

    it("should handle 1 day ago", () => {
      const date = new Date("2024-06-14T12:00:00Z");
      const result = formatDate(date, "timeSince");

      expect(result).toBe("1 day ago");
    });

    it("should throw for invalid format option", () => {
      const date = new Date("2024-06-15T12:00:00Z");
      // @ts-expect-error Testing invalid input
      expect(() => formatDate(date, "invalid")).toThrow("Invalid format option");
    });
  });

  describe("different locales", () => {
    it("should format with German locale", () => {
      const date = new Date("2024-06-15T10:30:00Z");
      const result = formatDate(date, "date", "de-DE");

      // German format: DD.MM.YYYY
      expect(result).toBe("15.06.2024");
    });

    it("should format with Italian locale", () => {
      const date = new Date("2024-06-15T10:30:00Z");
      const result = formatDate(date, "date", "it-IT");

      // Italian format: DD/MM/YYYY
      expect(result).toBe("15/06/2024");
    });
  });

  describe("timeSince in other languages", () => {
    it("keeps the English wording for en-GB", () => {
      expect(formatDate(new Date("2024-06-15T09:00:00Z"), "timeSince", "en-GB")).toBe("3 hours ago");
    });

    it("uses the locale's relative-time wording for Italian", () => {
      expect(formatDate(new Date("2024-06-15T09:00:00Z"), "timeSince", "it")).toBe("3 ore fa");
      expect(formatDate(new Date("2024-06-15T11:59:30Z"), "timeSince", "it")).toBe("30 secondi fa");
    });
  });

  describe("dateFormatLocale", () => {
    it("returns the app locale, English when missing", () => {
      expect(dateFormatLocale(undefined)).toBe("en");
      expect(dateFormatLocale("en")).toBe("en");
      expect(dateFormatLocale("it")).toBe("it");
    });
  });

  describe("explicit now", () => {
    it("measures timeSince against the passed now", () => {
      const now = new Date("2030-01-02T00:00:00Z");
      expect(formatDate(new Date("2030-01-01T00:00:00Z"), "timeSince", "en-GB", now)).toBe("1 day ago");
    });
  });
});

const normalise = (value: string): string => value.replace(/[\u202f\u00a0]/g, " ");
const sample = new Date("2026-04-25T21:30:00Z");

describe("resolveDateLocale", () => {
  it("takes the first browser locale whose language matches the app language", () => {
    expect(resolveDateLocale({ appLocale: "en", acceptLanguage: "en-GB,en;q=0.9" })).toBe("en-GB");
    expect(resolveDateLocale({ appLocale: "en", acceptLanguage: "en-US,en;q=0.9" })).toBe("en-US");
    expect(resolveDateLocale({ appLocale: "en", acceptLanguage: "en" })).toBe("en");
    expect(resolveDateLocale({ appLocale: "en", acceptLanguage: "it-IT,it;q=0.9,en-GB;q=0.8" })).toBe("en-GB");
  });

  it("falls back to the app language when no browser locale matches", () => {
    expect(resolveDateLocale({ appLocale: "it", acceptLanguage: "en-GB" })).toBe("it");
    expect(resolveDateLocale({ appLocale: "en" })).toBe("en");
  });

  it("follows quality order, not header order", () => {
    expect(resolveDateLocale({ appLocale: "en", acceptLanguage: "fr-FR,en-US;q=0.5,en-GB;q=0.9" })).toBe("en-GB");
  });

  it("resolveDateLocale tolerates malformed headers", () => {
    for (const acceptLanguage of ["*", "en-GB;q=abc", "zz-ZZ", "en-GB;q=0", ",".repeat(2000), ""]) {
      expect(() => resolveDateLocale({ appLocale: "en", acceptLanguage })).not.toThrow();
      expect(resolveDateLocale({ appLocale: "en", acceptLanguage })).toBe("en");
    }
  });
});

describe("formatDateStyle", () => {
  const expected: Record<DateFormatStyle, { "en-GB": string; "en-US": string }> = {
    date: { "en-GB": "25/04/2026", "en-US": "04/25/2026" },
    dateMedium: { "en-GB": "25 Apr 2026", "en-US": "Apr 25, 2026" },
    dateLong: { "en-GB": "25 April 2026", "en-US": "April 25, 2026" },
    dateTime: { "en-GB": "25/04/2026, 21:30", "en-US": "04/25/2026, 9:30 PM" },
    dateTimeMedium: { "en-GB": "25 Apr 2026, 21:30", "en-US": "Apr 25, 2026, 9:30 PM" },
    dateTimeLong: { "en-GB": "25 April 2026 at 21:30", "en-US": "April 25, 2026 at 9:30 PM" },
    dateTimeSeconds: { "en-GB": "25/04/2026, 21:30:00", "en-US": "04/25/2026, 9:30:00 PM" },
    time: { "en-GB": "21:30", "en-US": "9:30 PM" },
    weekdayDateTime: { "en-GB": "Sat 25 Apr, 21:30", "en-US": "Sat, Apr 25, 9:30 PM" },
    weekdayDay: { "en-GB": "Sat, 25 April 2026", "en-US": "Sat, April 25, 2026" },
    monthYear: { "en-GB": "Apr 2026", "en-US": "Apr 2026" },
    monthYearLong: { "en-GB": "April 2026", "en-US": "April 2026" },
    month: { "en-GB": "Apr", "en-US": "Apr" },
    monthLong: { "en-GB": "April", "en-US": "April" },
    dayMonth: { "en-GB": "25 Apr", "en-US": "Apr 25" },
    weekday: { "en-GB": "Sat", "en-US": "Sat" },
    weekdayLong: { "en-GB": "Saturday", "en-US": "Saturday" },
  };

  for (const style of Object.keys(expected) as DateFormatStyle[]) {
    for (const locale of ["en-GB", "en-US"] as const) {
      it(`formats ${style} for ${locale}`, () => {
        expect(normalise(formatDateStyle({ date: sample, style, locale, timeZone: "UTC" }))).toBe(
          expected[style][locale],
        );
      });
    }
  }

  it("never pins the clock", () => {
    for (const options of Object.values(DATE_STYLE_OPTIONS)) {
      expect(options).not.toHaveProperty("hour12");
      expect(options).not.toHaveProperty("hourCycle");
    }
  });

  it("maps numeric styles to month-as-word in public mode", () => {
    expect(PUBLIC_STYLE_MAP).toEqual({
      date: "dateMedium",
      dateTime: "dateTimeMedium",
      dateTimeSeconds: "dateTimeMedium",
    });
    expect(formatDateStyle({ date: sample, style: "date", locale: "en-GB", timeZone: "UTC", isPublic: true })).toBe(
      "25 Apr 2026",
    );
  });

  it("accepts an ISO string", () => {
    expect(formatDateStyle({ date: "2026-04-25T21:30:00Z", style: "date", locale: "en-GB", timeZone: "UTC" })).toBe(
      "25/04/2026",
    );
  });

  it("formatDateStyle returns empty for invalid dates", () => {
    expect(formatDateStyle({ date: undefined, style: "date", locale: "en-GB" })).toBe("");
    expect(formatDateStyle({ date: "nope", style: "date", locale: "en-GB" })).toBe("");
    expect(formatDateStyle({ date: new Date(NaN), style: "date", locale: "en-GB" })).toBe("");
  });
});

describe("formatRelativeDate", () => {
  const now = new Date("2026-04-25T21:30:00Z");

  it("says 1 day ago in English", () => {
    expect(formatRelativeDate({ date: new Date("2026-04-24T21:30:00Z"), locale: "en", now })).toBe("1 day ago");
  });

  it("uses Italian wording", () => {
    expect(formatRelativeDate({ date: new Date("2026-04-25T18:30:00Z"), locale: "it", now })).toBe("3 ore fa");
  });
});

describe("usesTwelveHourClock", () => {
  it("is true for en-US and en, false for en-GB and it", () => {
    expect(usesTwelveHourClock("en-US")).toBe(true);
    expect(usesTwelveHourClock("en")).toBe(true);
    expect(usesTwelveHourClock("en-GB")).toBe(false);
    expect(usesTwelveHourClock("it")).toBe(false);
  });
});
