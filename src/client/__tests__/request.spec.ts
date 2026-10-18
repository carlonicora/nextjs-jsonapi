import { afterEach, describe, expect, it, vi } from "vitest";
import { directFetch } from "../request";

describe("directFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports 503 when the API cannot be reached at all", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const response = await directFetch({ method: "GET", url: "http://api.test/users", language: "en" });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(503);
  });

  it("passes through a 500 the API actually returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 500, statusText: "Internal Server Error" })),
    );

    const response = await directFetch({ method: "GET", url: "http://api.test/users", language: "en" });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });
});
