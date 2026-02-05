import { describe, it, expect, beforeEach } from "vitest";
import { configureReferral, getReferralConfig, isReferralEnabled, DEFAULT_REFERRAL_CONFIG } from "../config";

describe("Referral Configuration", () => {
  beforeEach(() => {
    // Reset to defaults before each test
    configureReferral({});
  });

  describe("configureReferral()", () => {
    it("should set config values correctly", () => {
      configureReferral({
        enabled: true,
        cookieName: "my_referral",
        cookieDays: 60,
        urlParamName: "invite",
        referralUrlBase: "https://example.com",
        referralPath: "/signup",
      });

      const config = getReferralConfig();
      expect(config.enabled).toBe(true);
      expect(config.cookieName).toBe("my_referral");
      expect(config.cookieDays).toBe(60);
      expect(config.urlParamName).toBe("invite");
      expect(config.referralUrlBase).toBe("https://example.com");
      expect(config.referralPath).toBe("/signup");
    });

    it("should merge custom values with defaults", () => {
      configureReferral({ enabled: true, cookieDays: 60 });

      const config = getReferralConfig();
      expect(config.enabled).toBe(true);
      expect(config.cookieDays).toBe(60);
      // Default values should be preserved
      expect(config.cookieName).toBe(DEFAULT_REFERRAL_CONFIG.cookieName);
      expect(config.urlParamName).toBe(DEFAULT_REFERRAL_CONFIG.urlParamName);
      expect(config.referralPath).toBe(DEFAULT_REFERRAL_CONFIG.referralPath);
    });

    it("should overwrite previous configuration (singleton behavior)", () => {
      configureReferral({ enabled: true, cookieDays: 60 });
      configureReferral({ enabled: false, cookieName: "new_cookie" });

      const config = getReferralConfig();
      expect(config.enabled).toBe(false);
      expect(config.cookieName).toBe("new_cookie");
      // cookieDays should be reset to default
      expect(config.cookieDays).toBe(DEFAULT_REFERRAL_CONFIG.cookieDays);
    });
  });

  describe("isReferralEnabled()", () => {
    it("should return false by default", () => {
      expect(isReferralEnabled()).toBe(false);
    });

    it("should return true when enabled", () => {
      configureReferral({ enabled: true });
      expect(isReferralEnabled()).toBe(true);
    });

    it("should return false when explicitly disabled", () => {
      configureReferral({ enabled: false });
      expect(isReferralEnabled()).toBe(false);
    });
  });

  describe("getReferralConfig()", () => {
    it("should return default values before configure", () => {
      const config = getReferralConfig();
      expect(config.enabled).toBe(DEFAULT_REFERRAL_CONFIG.enabled);
      expect(config.cookieName).toBe(DEFAULT_REFERRAL_CONFIG.cookieName);
      expect(config.cookieDays).toBe(DEFAULT_REFERRAL_CONFIG.cookieDays);
      expect(config.urlParamName).toBe(DEFAULT_REFERRAL_CONFIG.urlParamName);
      expect(config.referralUrlBase).toBe(DEFAULT_REFERRAL_CONFIG.referralUrlBase);
      expect(config.referralPath).toBe(DEFAULT_REFERRAL_CONFIG.referralPath);
    });

    it("should return custom values after configure", () => {
      configureReferral({
        enabled: true,
        cookieName: "custom_cookie",
        cookieDays: 45,
      });

      const config = getReferralConfig();
      expect(config.enabled).toBe(true);
      expect(config.cookieName).toBe("custom_cookie");
      expect(config.cookieDays).toBe(45);
    });
  });

  describe("DEFAULT_REFERRAL_CONFIG", () => {
    it("should have expected default values", () => {
      expect(DEFAULT_REFERRAL_CONFIG.enabled).toBe(false);
      expect(DEFAULT_REFERRAL_CONFIG.cookieName).toBe("referral_code");
      expect(DEFAULT_REFERRAL_CONFIG.cookieDays).toBe(30);
      expect(DEFAULT_REFERRAL_CONFIG.urlParamName).toBe("ref");
      expect(DEFAULT_REFERRAL_CONFIG.referralUrlBase).toBe("");
      expect(DEFAULT_REFERRAL_CONFIG.referralPath).toBe("/");
    });
  });
});
