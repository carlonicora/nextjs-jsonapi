import { beforeEach, describe, expect, it } from "vitest";

import {
  clearLastApiMeta,
  clearLastApiTotal,
  getLastApiMeta,
  getLastApiTotal,
  setLastApiResponse,
} from "../lastApiResponse";

describe("lastApiResponse", () => {
  beforeEach(() => {
    clearLastApiTotal();
    clearLastApiMeta();
  });

  it("records the total of the response that just completed", () => {
    setLastApiResponse({ total: 407871 });

    expect(getLastApiTotal()).toBe(407871);
    expect(getLastApiMeta()).toEqual({ total: 407871 });
  });

  it("clears the total when the next response carries no meta", () => {
    setLastApiResponse({ total: 407871 });
    setLastApiResponse(undefined);

    expect(getLastApiTotal()).toBeUndefined();
    expect(getLastApiMeta()).toBeUndefined();
  });

  it("clears the total when the next response has meta without a total", () => {
    setLastApiResponse({ total: 407871 });
    setLastApiResponse({ unreadCount: 42 });

    expect(getLastApiTotal()).toBeUndefined();
    expect(getLastApiMeta()).toEqual({ unreadCount: 42 });
  });

  it("keeps a total of zero rather than treating it as absent", () => {
    setLastApiResponse({ total: 0 });

    expect(getLastApiTotal()).toBe(0);
  });
});
