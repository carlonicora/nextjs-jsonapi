import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OAUTH_SCOPE_DISPLAY } from "../../interfaces/oauth.interface";
import { useOAuthScopeText } from "../useOAuthScopeText";

// The suite's next-intl mock (vitest.setup.ts) returns the key itself.
describe("useOAuthScopeText", () => {
  it("reads the built-in scopes from oauth.ui.scopes.<id>.*", () => {
    const { result } = renderHook(() => useOAuthScopeText());

    expect(result.current("mcp")).toEqual({
      name: "oauth.ui.scopes.mcp.name",
      description: "oauth.ui.scopes.mcp.description",
    });
    expect(result.current(OAUTH_SCOPE_DISPLAY.read)).toEqual({
      name: "oauth.ui.scopes.read.name",
      description: "oauth.ui.scopes.read.description",
    });
  });

  it("keeps the text an app-defined scope carries, falling back to its id", () => {
    const { result } = renderHook(() => useOAuthScopeText());

    expect(result.current({ scope: "photos:read", name: "View Photographs", description: "See photos" })).toEqual({
      name: "View Photographs",
      description: "See photos",
    });
    expect(result.current("photos:write")).toEqual({ name: "photos:write", description: "" });
  });
});
