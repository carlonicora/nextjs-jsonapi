import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { configureJsonApi } from "../../../client/config";
import { HelpProvider, useHelp } from "./HelpContext";

describe("HelpProvider / useHelp", () => {
  const cfg = {
    brand: { logo: "/logo.png", label: "Test", appHref: "/" },
  };

  beforeEach(() => {
    configureJsonApi({ apiUrl: "http://localhost", helpContent: cfg });
  });

  it("exposes the configured helpContent via useHelp()", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <HelpProvider>{children}</HelpProvider>;
    const { result } = renderHook(() => useHelp(), { wrapper });
    expect(result.current.brand?.label).toBe("Test");
    expect(result.current.brand?.appHref).toBe("/");
  });

  it("throws when useHelp() is called outside HelpProvider", () => {
    expect(() => renderHook(() => useHelp())).toThrow(/outside <HelpProvider>/);
  });
});
