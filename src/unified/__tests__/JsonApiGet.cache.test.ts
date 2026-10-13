// The shared vitest.setup.ts touches `window`, so this file cannot switch to the
// node test environment. Stubbing `window` to undefined puts JsonApiGet on its
// server branch, which is what these tests pin.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerToken: vi.fn(),
  serverRequest: vi.fn(),
  translateResponse: vi.fn(),
}));

vi.mock("../../server/token", () => ({ getServerToken: mocks.getServerToken }));
vi.mock("../../server/request", () => ({ serverRequest: mocks.serverRequest }));
vi.mock("../../core/utils/translateResponse", () => ({ translateResponse: mocks.translateResponse }));

import { configureJsonApi, JsonApiGet } from "../JsonApiRequest";

describe("JsonApiGet on the server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("window", undefined);
    configureJsonApi({ apiUrl: "http://api.test" });
    mocks.getServerToken.mockResolvedValue("secret-token");
    mocks.serverRequest.mockResolvedValue({ data: undefined, ok: true, status: 200, statusText: "OK" });
    mocks.translateResponse.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not read the token cookie for a cached GET", async () => {
    expect(typeof window).toBe("undefined");

    await JsonApiGet({ classKey: { name: "help", cache: "help" } as any, endpoint: "/help", language: "en" });

    expect(mocks.getServerToken).not.toHaveBeenCalled();
    expect(mocks.serverRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: "http://api.test/help", cache: "help", token: undefined }),
    );
  });

  it("reads the token cookie for an uncached GET", async () => {
    await JsonApiGet({ classKey: { name: "users" } as any, endpoint: "/users", language: "en" });

    expect(mocks.getServerToken).toHaveBeenCalledTimes(1);
    expect(mocks.serverRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: "http://api.test/users", token: "secret-token" }),
    );
  });
});
