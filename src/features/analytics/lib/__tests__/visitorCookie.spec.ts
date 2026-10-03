import { afterEach, describe, expect, it, vi } from "vitest";

// Records every setCookie call while still writing the real cookie to jsdom,
// so the options (SameSite, maxAge) and document.cookie can both be asserted.
const recorded = vi.hoisted(() => ({ calls: [] as unknown[][] }));

vi.mock("cookies-next", async () => {
  const actual = await vi.importActual<typeof import("cookies-next")>("cookies-next");
  return {
    ...actual,
    setCookie: (...args: unknown[]) => {
      recorded.calls.push(args);
      return (actual.setCookie as (...a: unknown[]) => unknown)(...args);
    },
  };
});

import { ANALYTICS_VISITOR_COOKIE, clearVisitorCookie, ensureVisitorCookie, readVisitorCookie } from "../visitorCookie";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("visitorCookie", () => {
  afterEach(() => {
    clearVisitorCookie();
    recorded.calls = [];
  });

  it("names the cookie analytics_visitor", () => {
    expect(ANALYTICS_VISITOR_COOKIE).toBe("analytics_visitor");
  });

  it("creates a UUID and writes it with SameSite=Lax and a ~395-day expiry", () => {
    const id = ensureVisitorCookie();

    expect(id).toMatch(UUID);
    expect(document.cookie).toContain(`analytics_visitor=${id}`);

    expect(recorded.calls).toHaveLength(1);
    const [name, value, options] = recorded.calls[0] as [string, string, Record<string, unknown>];
    expect(name).toBe("analytics_visitor");
    expect(value).toBe(id);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(395 * 24 * 3600);
  });

  it("returns the same id on a second call without rewriting the cookie", () => {
    const first = ensureVisitorCookie();
    const second = ensureVisitorCookie();

    expect(second).toBe(first);
    expect(recorded.calls).toHaveLength(1);
  });

  it("clears the cookie so readVisitorCookie returns undefined", () => {
    ensureVisitorCookie();
    expect(readVisitorCookie()).toBeDefined();

    clearVisitorCookie();

    expect(readVisitorCookie()).toBeUndefined();
  });
});
