import { afterEach, describe, expect, it, vi } from "vitest";
import { configureI18n, getI18nServerLocale, type I18nConfig } from "../config";

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
