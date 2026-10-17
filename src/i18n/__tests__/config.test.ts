import { afterEach, describe, expect, it, vi } from "vitest";
import { configureI18n, getI18nServerLocale, getI18nSupportedLocales, type I18nConfig } from "../config";

function config(getLocale: I18nConfig["getLocale"]): I18nConfig {
  return {
    useRouter: vi.fn(),
    useTranslations: vi.fn(),
    Link: vi.fn() as unknown as I18nConfig["Link"],
    usePathname: vi.fn(),
    getLocale,
  };
}

describe("getI18nServerLocale", () => {
  afterEach(() => {
    configureI18n(null as unknown as I18nConfig);
  });

  it("returns the locale from the configured getLocale", async () => {
    configureI18n(config(async () => "it"));
    await expect(getI18nServerLocale()).resolves.toBe("it");
  });

  it("throws when i18n is not configured", async () => {
    await expect(getI18nServerLocale()).rejects.toThrow(/configureI18n/);
  });
});

describe("getI18nSupportedLocales", () => {
  afterEach(() => {
    configureI18n(null as unknown as I18nConfig);
  });

  it('returns ["en"] when i18n is not configured', () => {
    expect(getI18nSupportedLocales()).toEqual(["en"]);
  });

  it('returns ["en"] when supportedLocales is not set', () => {
    configureI18n(config(async () => "en"));
    expect(getI18nSupportedLocales()).toEqual(["en"]);
  });

  it("returns the configured supported locales", () => {
    configureI18n({ ...config(async () => "en"), supportedLocales: ["en", "it"] });
    expect(getI18nSupportedLocales()).toEqual(["en", "it"]);
  });
});
