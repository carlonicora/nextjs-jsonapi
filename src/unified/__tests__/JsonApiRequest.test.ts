import { afterEach, describe, expect, it, vi } from "vitest";
import { buildUrl } from "../JsonApiRequest";

describe("buildUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses NEXT_PUBLIC_API_URL when baseUrl is omitted", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");

    expect(buildUrl("/sncass/sync")).toBe("https://api.example.com/sncass/sync");
  });

  it("uses the per-call baseUrl override when provided", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");

    expect(buildUrl("/sncass/sync", "https://corpus.example.com")).toBe("https://corpus.example.com/sncass/sync");
  });

  it("passes through an http-prefixed endpoint regardless of baseUrl", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");

    expect(buildUrl("https://elsewhere.example.com/sncass/sync", "https://corpus.example.com")).toBe(
      "https://elsewhere.example.com/sncass/sync",
    );
    expect(buildUrl("https://elsewhere.example.com/sncass/sync")).toBe("https://elsewhere.example.com/sncass/sync");
  });
});
