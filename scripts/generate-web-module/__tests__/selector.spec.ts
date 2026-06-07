import { describe, it, expect } from "vitest";
import { makeFrontendData } from "./fixtures";
import { generateSelectorTemplate } from "../templates/components/selector.template";

describe("selector template — UserSelector-style UI", () => {
  it("uses the input-styled trigger + custom search Input (mirrors UserSelector)", () => {
    const out = generateSelectorTemplate(makeFrontendData());
    expect(out).toContain("CircleX");
    expect(out).toContain("SearchIcon");
    expect(out).toContain("RefreshCwIcon");
    expect(out).toContain("bg-input/20");
    expect(out).toContain("w-(--anchor-width)");
    expect(out).toContain("ui.search.placeholder");
    // custom <Input> search, not the cmdk CommandInput
    expect(out).toContain("<Input");
    expect(out).toContain("CommandList");
    expect(out).toContain("CommandItem");
  });

  it("drops the legacy Button-combobox styling", () => {
    const out = generateSelectorTemplate(makeFrontendData());
    expect(out).not.toContain('role="combobox"');
    expect(out).not.toContain("ChevronsUpDown");
    expect(out).not.toContain("CommandInput");
    expect(out).not.toContain("CommandEmpty");
    expect(out).not.toContain("CommandGroup");
    expect(out).not.toContain("w-(--radix-popover-trigger-width)");
  });
});
