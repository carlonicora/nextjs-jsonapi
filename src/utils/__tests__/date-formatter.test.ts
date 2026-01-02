import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDate, FormatOption } from "../date-formatter";

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

      expect(result).toBe("1 minutes ago");
    });

    it("should handle 1 hour ago", () => {
      const date = new Date("2024-06-15T11:00:00Z");
      const result = formatDate(date, "timeSince");

      expect(result).toBe("1 hours ago");
    });

    it("should handle 1 day ago", () => {
      const date = new Date("2024-06-14T12:00:00Z");
      const result = formatDate(date, "timeSince");

      expect(result).toBe("1 days ago");
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
});
