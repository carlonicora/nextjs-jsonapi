import { describe, expect, it, vi } from "vitest";
import { DEFAULT_AI_GENERATE_ACTIONS, generateActionItems } from "../BlockNoteEditorAiActions";

/** Stands in for next-intl's translator: returns the English message for each key. */
const english: Record<string, string> = {
  "ui.editor.ai.generate_from_template": "Generate from Template",
  "ui.editor.ai.suggest_impression": "Suggest impression",
};
const translate = (key: string) => english[key] ?? key;

describe("generateActionItems", () => {
  it("defaults to Generate from Template only, so existing editors are unchanged", () => {
    const items = generateActionItems(undefined, vi.fn(), translate);
    expect(DEFAULT_AI_GENERATE_ACTIONS).toEqual(["fill-template"]);
    expect(items.map((i) => i.key)).toEqual(["generate_from_template"]);
    expect(items[0].title).toBe("Generate from Template");
  });

  it("offers Suggest impression when asked, and invokes with that type", () => {
    const invoke = vi.fn();
    const items = generateActionItems(["draft-impression"], invoke, translate);
    expect(items.map((i) => i.key)).toEqual(["suggest_impression"]);
    expect(items[0].title).toBe("Suggest impression");
    items[0].onItemClick();
    expect(invoke).toHaveBeenCalledWith("draft-impression");
  });

  it("keeps the caller's order when both are requested", () => {
    const items = generateActionItems(["draft-impression", "fill-template"], vi.fn(), translate);
    expect(items.map((i) => i.key)).toEqual(["suggest_impression", "generate_from_template"]);
  });
});
