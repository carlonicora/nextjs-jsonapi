import { describe, it, expect } from "vitest";
import { makeFrontendData } from "./fixtures";
import { generateSelectorTemplate } from "../templates/components/selector.template";

describe("selector template — combobox style", () => {
  it("uses Button combobox trigger + Command primitives + Loader2", () => {
    const out = generateSelectorTemplate(makeFrontendData());
    expect(out).toContain('role="combobox"');
    expect(out).toContain("ChevronsUpDown");
    expect(out).toContain("CommandInput");
    expect(out).toContain("CommandEmpty");
    expect(out).toContain("CommandGroup");
    expect(out).toContain("Loader2");
    expect(out).toContain("w-(--radix-popover-trigger-width) p-0");
  });

  it("drops the legacy bespoke styling", () => {
    const out = generateSelectorTemplate(makeFrontendData());
    expect(out).not.toContain("CircleX");
    expect(out).not.toContain("RefreshCwIcon");
    expect(out).not.toContain("SearchIcon");
    expect(out).not.toContain("bg-input/20");
  });
});
