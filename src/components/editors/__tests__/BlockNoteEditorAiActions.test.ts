import { describe, expect, it, vi } from "vitest";
import { DEFAULT_AI_GENERATE_ACTIONS, generateActionItems } from "../BlockNoteEditorAiActions";

describe("generateActionItems", () => {
  it("defaults to Generate from Template only, so existing editors are unchanged", () => {
    const items = generateActionItems(undefined, vi.fn());
    expect(DEFAULT_AI_GENERATE_ACTIONS).toEqual(["fill-template"]);
    expect(items.map((i) => i.key)).toEqual(["generate_from_template"]);
    expect(items[0].title).toBe("Generate from Template");
  });

  it("offers Suggest impression when asked, and invokes with that type", () => {
    const invoke = vi.fn();
    const items = generateActionItems(["draft-impression"], invoke);
    expect(items.map((i) => i.key)).toEqual(["suggest_impression"]);
    expect(items[0].title).toBe("Suggest impression");
    items[0].onItemClick();
    expect(invoke).toHaveBeenCalledWith("draft-impression");
  });

  it("keeps the caller's order when both are requested", () => {
    const items = generateActionItems(["draft-impression", "fill-template"], vi.fn());
    expect(items.map((i) => i.key)).toEqual(["suggest_impression", "generate_from_template"]);
  });
});
