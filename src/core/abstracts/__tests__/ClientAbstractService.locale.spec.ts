import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { clientJsonApiGet } = vi.hoisted(() => ({
  clientJsonApiGet: vi.fn(),
}));

vi.mock("../../../client/JsonApiClient", () => ({
  ClientJsonApiGet: clientJsonApiGet,
  ClientJsonApiPost: vi.fn(),
  ClientJsonApiPut: vi.fn(),
  ClientJsonApiPatch: vi.fn(),
  ClientJsonApiDelete: vi.fn(),
}));

import { configureI18n, type I18nConfig } from "../../../i18n/config";
import { ClientAbstractService, ClientHttpMethod } from "../ClientAbstractService";

class TestClientService extends ClientAbstractService {
  static read() {
    return this.callApi({
      type: { name: "tests" } as any,
      method: ClientHttpMethod.GET,
      endpoint: "https://api.test/tests",
    });
  }
}

describe("ClientAbstractService client locale", () => {
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
    clientJsonApiGet.mockReset();
    clientJsonApiGet.mockResolvedValue({ ok: true, response: 200, data: [], included: [] });
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

    await TestClientService.read().catch(() => undefined);

    expect(clientJsonApiGet).toHaveBeenCalledWith(expect.objectContaining({ language: expected }));
  });
});
