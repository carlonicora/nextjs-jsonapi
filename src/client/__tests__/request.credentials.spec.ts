import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AbstractService, HttpMethod } from "../../core/abstracts/AbstractService";
import { ClientAbstractService, ClientHttpMethod } from "../../core/abstracts/ClientAbstractService";
import { ApiRequestDataTypeInterface } from "../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../core/registry/ModuleRegistry";
import { DiscordConnectIntent } from "../../features/discord-connection/data/discord-connect-intent";
import { directFetch } from "../request";

const TYPE = { name: "tests" } as any;
const ENDPOINT = "http://api.test/tests";
// Built by a model method, as references/frontend/03-services.md allows with overridesJsonApiCreation.
const body = () => new DiscordConnectIntent().createJsonApi({ id: "t-1", returnPath: "/" });

// createJsonApi() resolves Modules.X through the real ModuleRegistry,
// which is shared across test files in a worker: register only when absent.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("DiscordConnectIntent", { name: "discord-connect-intents", model: DiscordConnectIntent } as any);
});

class TestService extends AbstractService {
  static post(credentials?: RequestCredentials) {
    return this.callApi({
      type: TYPE,
      method: HttpMethod.POST,
      endpoint: ENDPOINT,
      input: body(),
      overridesJsonApiCreation: true,
      suppressGlobalError: true,
      ...(credentials ? { credentials } : {}),
    });
  }
}

class TestClientService extends ClientAbstractService {
  static post(credentials?: RequestCredentials) {
    return this.callApi({
      type: TYPE,
      method: ClientHttpMethod.POST,
      endpoint: ENDPOINT,
      input: body(),
      overridesJsonApiCreation: true,
      ...(credentials ? { credentials } : {}),
    });
  }
}

const fetchOptions = (fetchMock: ReturnType<typeof vi.fn>): RequestInit => fetchMock.mock.calls[0][1] as RequestInit;

describe("callApi credentials", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // A 500 keeps the response path out of the test: only the fetch options matter.
    fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("callApi passes credentials to fetch", async () => {
    await TestService.post("include").catch(() => undefined);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchOptions(fetchMock).credentials).toBe("include");
  });

  it("callApi without credentials leaves fetch options unchanged", async () => {
    await TestService.post().catch(() => undefined);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(Object.keys(fetchOptions(fetchMock)).sort()).toEqual(["body", "headers", "method"]);
  });

  it("ClientAbstractService callApi passes credentials to fetch", async () => {
    await TestClientService.post("include").catch(() => undefined);

    expect(fetchOptions(fetchMock).credentials).toBe("include");
  });

  it("ClientAbstractService callApi without credentials leaves fetch options unchanged", async () => {
    await TestClientService.post().catch(() => undefined);

    expect(Object.keys(fetchOptions(fetchMock)).sort()).toEqual(["body", "headers", "method"]);
  });

  it("directFetch sets credentials only when given", async () => {
    await directFetch({ method: "GET", url: ENDPOINT, language: "en", credentials: "include" });
    await directFetch({ method: "GET", url: ENDPOINT, language: "en" });

    expect((fetchMock.mock.calls[0][1] as RequestInit).credentials).toBe("include");
    expect("credentials" in (fetchMock.mock.calls[1][1] as RequestInit)).toBe(false);
  });
});
