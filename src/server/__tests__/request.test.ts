import { afterEach, describe, expect, it, vi } from "vitest";
import { serverRequest } from "../request";

describe("serverRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports 503 when the API cannot be reached at all", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await serverRequest({ method: "GET", url: "http://api.test/users", language: "en" } as any);

    expect(response.ok).toBe(false);
    expect(response.status).toBe(503);
  });
});
