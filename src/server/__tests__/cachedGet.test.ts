import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nextCache = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/cache", () => nextCache);

import { cachedServerGet, statusFromDigest } from "../cachedGet";

function okResponse(body: unknown) {
  return { ok: true, status: 200, statusText: "OK", json: async () => body };
}

describe("cachedServerGet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls cacheLife for a profile name", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ data: [] })));

    await cachedServerGet({ url: "http://api.test/help", cache: "hours", language: "en" });

    expect(nextCache.cacheLife).toHaveBeenCalledWith("hours");
    expect(nextCache.cacheTag).not.toHaveBeenCalled();
  });

  it("tags non-profile values and applies the default life", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ data: [] })));

    await cachedServerGet({ url: "http://api.test/help", cache: "help", language: "en" });

    expect(nextCache.cacheTag).toHaveBeenCalledWith("help");
    expect(nextCache.cacheLife).toHaveBeenCalledWith("max");
  });

  it("never sends Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await cachedServerGet({
      url: "http://api.test/help",
      cache: "help",
      language: "it",
      companyId: "company-1",
      additionalHeaders: { "x-extra": "1" },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/help");
    expect(init.method).toBe("GET");
    expect(init.headers).not.toHaveProperty("Authorization");
    expect(init.headers["x-language"]).toBe("it");
    expect(init.headers["x-companyid"]).toBe("company-1");
    expect(init.headers["x-extra"]).toBe("1");
    expect(init).not.toHaveProperty("next");
  });

  it("returns the parsed body on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ data: { id: "1" } })));

    const response = await cachedServerGet({ url: "http://api.test/help", cache: "help", language: "en" });

    expect(response).toEqual({ data: { data: { id: "1" } }, ok: true, status: 200, statusText: "OK" });
  });

  it("does not cache a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500, statusText: "Internal Server Error", json: async () => ({}) }),
    );

    const error = await cachedServerGet({ url: "http://api.test/help", cache: "help", language: "en" }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as any).digest).toBe("HTTP_500");
    expect((error as any).status).toBe(500);
  });

  it("throws a 503 when the API cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const error = await cachedServerGet({ url: "http://api.test/help", cache: "help", language: "en" }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as any).digest).toBe("HTTP_503");
    expect((error as any).status).toBe(503);
  });
});

describe("statusFromDigest", () => {
  it("reads the status from an HTTP digest", () => {
    expect(statusFromDigest({ digest: "HTTP_404" })).toBe(404);
  });

  it("reads the status from a sanitised production error", () => {
    const sanitised = Object.assign(new Error("An error occurred in the Server Components render."), {
      digest: "HTTP_500",
    });
    expect(statusFromDigest(sanitised)).toBe(500);
  });

  it("returns undefined for a hashed digest", () => {
    expect(statusFromDigest({ digest: "123456" })).toBeUndefined();
  });

  it("returns undefined for values without a digest", () => {
    expect(statusFromDigest(undefined)).toBeUndefined();
    expect(statusFromDigest(new Error("x"))).toBeUndefined();
  });
});
