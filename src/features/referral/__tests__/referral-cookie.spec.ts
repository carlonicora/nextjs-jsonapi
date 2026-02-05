import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { configureReferral, DEFAULT_REFERRAL_CONFIG } from "../config";
import { setReferralCode, getReferralCode, clearReferralCode } from "../utils/referral-cookie";

describe("Referral Cookie Utilities", () => {
  let cookieStore: Record<string, string> = {};
  let documentCookieDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    // Reset configuration to defaults
    configureReferral({});
    cookieStore = {};

    // Save original cookie descriptor
    documentCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");

    // Mock document.cookie
    Object.defineProperty(document, "cookie", {
      get: () => {
        return Object.entries(cookieStore)
          .map(([name, value]) => `${name}=${value}`)
          .join("; ");
      },
      set: (cookieString: string) => {
        // Parse the cookie string
        const parts = cookieString.split(";");
        const [nameValue] = parts;
        const [name, value] = nameValue.split("=");

        // Check for max-age=0 (deletion)
        const maxAgeMatch = cookieString.match(/max-age=(\d+)/i);
        if (maxAgeMatch && maxAgeMatch[1] === "0") {
          delete cookieStore[name.trim()];
        } else if (value !== undefined) {
          cookieStore[name.trim()] = value;
        }
      },
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original cookie descriptor
    if (documentCookieDescriptor) {
      Object.defineProperty(Document.prototype, "cookie", documentCookieDescriptor);
    }
    vi.restoreAllMocks();
  });

  describe("setReferralCode()", () => {
    it("should set cookie with configured name", () => {
      setReferralCode("test-code-123");
      expect(cookieStore["referral_code"]).toBe("test-code-123");
    });

    it("should use custom cookie name when configured", () => {
      configureReferral({ cookieName: "my_ref_code" });
      setReferralCode("custom-code");
      expect(cookieStore["my_ref_code"]).toBe("custom-code");
    });

    it("should URL encode the referral code", () => {
      setReferralCode("code with spaces & special=chars");
      expect(cookieStore["referral_code"]).toBe("code%20with%20spaces%20%26%20special%3Dchars");
    });

    it("should set cookie with configured duration in max-age", () => {
      const setCookieSpy = vi.spyOn(document, "cookie", "set");
      configureReferral({ cookieDays: 60 });

      setReferralCode("test-code");

      const expectedMaxAge = 60 * 24 * 60 * 60; // 60 days in seconds
      expect(setCookieSpy).toHaveBeenCalledWith(expect.stringContaining(`max-age=${expectedMaxAge}`));
    });

    it("should use default 30 day duration", () => {
      const setCookieSpy = vi.spyOn(document, "cookie", "set");
      setReferralCode("test-code");

      const expectedMaxAge = 30 * 24 * 60 * 60; // 30 days in seconds
      expect(setCookieSpy).toHaveBeenCalledWith(expect.stringContaining(`max-age=${expectedMaxAge}`));
    });

    it("should set path to root and SameSite=Lax", () => {
      const setCookieSpy = vi.spyOn(document, "cookie", "set");
      setReferralCode("test-code");

      expect(setCookieSpy).toHaveBeenCalledWith(expect.stringContaining("path=/"));
      expect(setCookieSpy).toHaveBeenCalledWith(expect.stringContaining("SameSite=Lax"));
    });
  });

  describe("getReferralCode()", () => {
    it("should return stored value", () => {
      cookieStore["referral_code"] = "stored-code";
      expect(getReferralCode()).toBe("stored-code");
    });

    it("should return null when no cookie exists", () => {
      expect(getReferralCode()).toBeNull();
    });

    it("should use custom cookie name when configured", () => {
      configureReferral({ cookieName: "my_ref_code" });
      cookieStore["my_ref_code"] = "custom-stored-code";
      expect(getReferralCode()).toBe("custom-stored-code");
    });

    it("should not return value from wrong cookie name", () => {
      configureReferral({ cookieName: "my_ref_code" });
      cookieStore["referral_code"] = "wrong-cookie";
      expect(getReferralCode()).toBeNull();
    });

    it("should URL decode the referral code", () => {
      cookieStore["referral_code"] = "code%20with%20spaces%20%26%20special%3Dchars";
      expect(getReferralCode()).toBe("code with spaces & special=chars");
    });

    it("should return null when cookie value is empty", () => {
      cookieStore["referral_code"] = "";
      expect(getReferralCode()).toBeNull();
    });
  });

  describe("clearReferralCode()", () => {
    it("should remove the cookie", () => {
      cookieStore["referral_code"] = "existing-code";
      clearReferralCode();
      expect(cookieStore["referral_code"]).toBeUndefined();
    });

    it("should use configured cookie name for clearing", () => {
      configureReferral({ cookieName: "my_ref_code" });
      cookieStore["my_ref_code"] = "existing-code";
      clearReferralCode();
      expect(cookieStore["my_ref_code"]).toBeUndefined();
    });

    it("should set max-age to 0 for deletion", () => {
      const setCookieSpy = vi.spyOn(document, "cookie", "set");
      clearReferralCode();
      expect(setCookieSpy).toHaveBeenCalledWith(expect.stringContaining("max-age=0"));
    });

    it("should handle clearing non-existent cookie gracefully", () => {
      // Should not throw
      expect(() => clearReferralCode()).not.toThrow();
    });
  });

  describe("Integration scenarios", () => {
    it("should set and get referral code correctly", () => {
      setReferralCode("integration-test-code");
      expect(getReferralCode()).toBe("integration-test-code");
    });

    it("should set, get, and clear referral code correctly", () => {
      setReferralCode("to-be-cleared");
      expect(getReferralCode()).toBe("to-be-cleared");

      clearReferralCode();
      expect(getReferralCode()).toBeNull();
    });

    it("should overwrite existing referral code", () => {
      setReferralCode("first-code");
      expect(getReferralCode()).toBe("first-code");

      setReferralCode("second-code");
      expect(getReferralCode()).toBe("second-code");
    });

    it("should work with different configurations", () => {
      configureReferral({
        cookieName: "custom_ref",
        cookieDays: 7,
      });

      setReferralCode("custom-config-code");
      expect(getReferralCode()).toBe("custom-config-code");

      clearReferralCode();
      expect(getReferralCode()).toBeNull();
    });
  });
});
