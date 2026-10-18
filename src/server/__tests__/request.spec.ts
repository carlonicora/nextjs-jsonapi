import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cachedGet = vi.hoisted(() => ({ cachedServerGet: vi.fn() }));

vi.mock("../cachedGet", async () => {
  const actual = await vi.importActual<typeof import("../cachedGet")>("../cachedGet");
  return { ...actual, cachedServerGet: cachedGet.cachedServerGet };
});

import { serverRequest } from "../request";

function okResponse(body: unknown) {
  return { ok: true, status: 200, statusText: "OK", json: async () => body };
}

describe("serverRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports 503 when the API cannot be reached at all", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await serverRequest({ method: "GET", url: "http://api.test/users", language: "en" } as any);

    expect(response.ok).toBe(false);
    expect(response.status).toBe(503);
  });

  it("routes a cached GET to cachedServerGet", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const cached = { data: { data: [] }, ok: true, status: 200, statusText: "OK" };
    cachedGet.cachedServerGet.mockResolvedValue(cached);

    const response = await serverRequest({
      method: "GET",
      url: "http://api.test/help",
      token: "secret-token",
      cache: "help",
      companyId: "company-1",
      language: "en",
      additionalHeaders: { "x-extra": "1" },
    });

    expect(response).toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cachedGet.cachedServerGet).toHaveBeenCalledWith({
      url: "http://api.test/help",
      cache: "help",
      companyId: "company-1",
      language: "en",
      additionalHeaders: { "x-extra": "1" },
    });
    expect(JSON.stringify(cachedGet.cachedServerGet.mock.calls[0])).not.toContain("secret-token");
  });

  it("sends POST uncached even when cache is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await serverRequest({
      method: "POST",
      url: "http://api.test/help",
      token: "secret-token",
      cache: "help",
      body: { a: 1 },
      language: "en",
    });

    expect(cachedGet.cachedServerGet).not.toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect(init).not.toHaveProperty("next");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer secret-token");
  });

  it("sends uncached GET with no next options", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await serverRequest({ method: "GET", url: "http://api.test/users", token: "secret-token", language: "en" });

    expect(cachedGet.cachedServerGet).not.toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect(init).not.toHaveProperty("next");
    expect(init.headers.Authorization).toBe("Bearer secret-token");
  });

  it("reads the status back from the digest", async () => {
    cachedGet.cachedServerGet.mockRejectedValue({ digest: "HTTP_500" });

    const response = await serverRequest({ method: "GET", url: "http://api.test/help", cache: "help", language: "en" });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    expect(response.data).toBeUndefined();
  });

  it("falls back to 503 when the digest carries no status", async () => {
    cachedGet.cachedServerGet.mockRejectedValue(Object.assign(new Error("sanitised"), { digest: "2916868796" }));

    const response = await serverRequest({ method: "GET", url: "http://api.test/help", cache: "help", language: "en" });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(503);
  });
});
