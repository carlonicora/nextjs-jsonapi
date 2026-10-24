import { describe, expect, it } from "vitest";
import { urlWithoutParam } from "../url";

describe("urlWithoutParam", () => {
  it("keeps the section when it drops the action", () => {
    expect(
      urlWithoutParam({ pathname: "/settings", search: "?section=billing&action=subscribe", param: "action" }),
    ).toBe("/settings?section=billing");
  });

  it("keeps the section when the action comes first", () => {
    expect(
      urlWithoutParam({ pathname: "/it/settings", search: "?action=subscribe&section=billing", param: "action" }),
    ).toBe("/it/settings?section=billing");
  });

  it("returns the bare path when the action was the only parameter", () => {
    expect(urlWithoutParam({ pathname: "/billing", search: "?action=subscribe", param: "action" })).toBe("/billing");
  });

  it("leaves a URL without the parameter unchanged, hash included", () => {
    expect(
      urlWithoutParam({ pathname: "/settings", search: "?section=billing", hash: "#plans", param: "action" }),
    ).toBe("/settings?section=billing#plans");
  });

  it("accepts a search string without the leading question mark", () => {
    expect(
      urlWithoutParam({ pathname: "/settings", search: "section=billing&action=subscribe", param: "action" }),
    ).toBe("/settings?section=billing");
  });
});
