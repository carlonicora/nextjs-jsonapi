import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The library must not import next-intl itself: instrumentation loads the library, and
// next-intl's getLocale pulls in the app's i18n/request.ts, which reads `next/root-params`
// (only allowed inside the app directory). The locale comes from configureI18n instead.
const { nextIntlServer, jsonApiGet } = vi.hoisted(() => ({
  nextIntlServer: vi.fn(),
  jsonApiGet: vi.fn(),
}));

vi.mock("next-intl/server", () => {
  nextIntlServer();
  return { getLocale: vi.fn(async () => "xx") };
});

vi.mock("../../../unified/JsonApiRequest", () => ({
  JsonApiGet: jsonApiGet,
  JsonApiPost: vi.fn(),
  JsonApiPut: vi.fn(),
  JsonApiPatch: vi.fn(),
  JsonApiDelete: vi.fn(),
}));

import { configureI18n, type I18nConfig } from "../../../i18n/config";
import { AbstractService, HttpMethod } from "../AbstractService";

class TestService extends AbstractService {
  static read() {
    return this.callApi({ type: { name: "tests" } as any, method: HttpMethod.GET, endpoint: "https://api.test/tests" });
  }
}

describe("AbstractService server locale", () => {
  beforeEach(() => {
    vi.stubGlobal("window", undefined);
    jsonApiGet.mockResolvedValue({ ok: true, response: 200, data: [], included: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    configureI18n(null as unknown as I18nConfig);
  });

  it("reads the server locale from configureI18n, never from next-intl", async () => {
    configureI18n({
      useRouter: vi.fn(),
      useTranslations: vi.fn(),
      Link: vi.fn() as unknown as I18nConfig["Link"],
      usePathname: vi.fn(),
      getLocale: async () => "it",
    });

    await TestService.read().catch(() => undefined);

    expect(typeof window).toBe("undefined");
    expect(jsonApiGet).toHaveBeenCalledWith(expect.objectContaining({ language: "it" }));
    expect(nextIntlServer).not.toHaveBeenCalled();
  });

  it("fails loudly when configureI18n has no getLocale", async () => {
    await expect(TestService.read()).rejects.toThrow(/configureI18n/);
    expect(jsonApiGet).not.toHaveBeenCalled();
  });
});

describe("AbstractService client locale", () => {
  function configure(supportedLocales: string[]) {
    configureI18n({
      useRouter: vi.fn(),
      useTranslations: vi.fn(),
      Link: vi.fn() as unknown as I18nConfig["Link"],
      usePathname: vi.fn(),
      getLocale: async () => "xx",
      supportedLocales,
    });
  }

  function visit(pathname: string, browserLanguage: string) {
    vi.stubGlobal("window", { location: { pathname } });
    vi.stubGlobal("navigator", { language: browserLanguage });
  }

  beforeEach(() => {
    jsonApiGet.mockReset();
    jsonApiGet.mockResolvedValue({ ok: true, response: 200, data: [], included: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    configureI18n(null as unknown as I18nConfig);
  });

  it.each([
    ["/compendium", ["en", "it"], "it-IT", "en"],
    ["/it/compendium", ["en", "it"], "it-IT", "it"],
    ["/xx/compendium", ["en", "it"], "it-IT", "en"],
    // The first supported locale, not a hard-coded "en" (and not the browser's "en-US").
    ["/compendium", ["it", "en"], "en-US", "it"],
  ])("%s with supported locales %j and browser %s sends %s", async (pathname, locales, browserLanguage, expected) => {
    configure(locales);
    visit(pathname, browserLanguage);

    await TestService.read().catch(() => undefined);

    expect(jsonApiGet).toHaveBeenCalledWith(expect.objectContaining({ language: expected }));
  });
});
