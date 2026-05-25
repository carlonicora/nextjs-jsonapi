import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { configureJsonApi } from "../../../client/config";
import { HelpProvider, useHelp } from "./HelpContext";

describe("HelpProvider / useHelp", () => {
  const cfg = {
    manifest: [],
    namespaceUuid: "00000000-0000-5000-8000-000000000000",
    brand: { logo: "/logo.png", label: "Test", appHref: "/" },
  };

  beforeEach(() => {
    configureJsonApi({ apiUrl: "http://localhost", helpContent: cfg });
  });

  it("exposes the configured helpContent via useHelp()", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <HelpProvider>{children}</HelpProvider>;
    const { result } = renderHook(() => useHelp(), { wrapper });
    expect(result.current.manifest).toBe(cfg.manifest);
    expect(result.current.brand?.label).toBe("Test");
  });

  it("throws when useHelp() is called outside HelpProvider", () => {
    expect(() => renderHook(() => useHelp())).toThrow(/outside <HelpProvider>/);
  });
});
