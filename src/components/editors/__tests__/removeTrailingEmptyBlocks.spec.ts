import { describe, expect, it } from "vitest";
import { removeTrailingEmptyBlocks } from "../blockNoteEditorOptions";

const text = (id: string, value: string) =>
  ({ id, type: "paragraph", content: [{ type: "text", text: value, styles: {} }], children: [] }) as any;
const empty = (id: string) => ({ id, type: "paragraph", content: [], children: [] }) as any;
const mentionOnly = (id: string) =>
  ({
    id,
    type: "paragraph",
    content: [{ type: "mention", props: { id: "n1", alias: "The Baron", entityType: "npcs" } }],
    children: [],
  }) as any;

describe("removeTrailingEmptyBlocks", () => {
  it("removes trailing empty and blank paragraphs", () => {
    const blocks = [text("a", "hello"), empty("b"), text("c", "   ")];
    expect(removeTrailingEmptyBlocks(blocks).map((b: any) => b.id)).toEqual(["a"]);
  });

  it("keeps at least one block", () => {
    expect(removeTrailingEmptyBlocks([empty("a"), empty("b")]).map((b: any) => b.id)).toEqual(["a"]);
  });

  it("keeps a trailing paragraph that holds only a mention", () => {
    const blocks = [text("a", "hello"), mentionOnly("b")];
    expect(removeTrailingEmptyBlocks(blocks).map((b: any) => b.id)).toEqual(["a", "b"]);
  });

  it("keeps a trailing paragraph that holds only a link", () => {
    const link = {
      id: "b",
      type: "paragraph",
      content: [{ type: "link", href: "https://x.test", content: [{ type: "text", text: "x", styles: {} }] }],
      children: [],
    } as any;
    expect(removeTrailingEmptyBlocks([text("a", "hello"), link]).map((b: any) => b.id)).toEqual(["a", "b"]);
  });

  it("keeps a trailing empty paragraph that has nested blocks", () => {
    const parent = { ...empty("b"), children: [text("c", "nested")] };
    expect(removeTrailingEmptyBlocks([text("a", "hello"), parent]).map((b: any) => b.id)).toEqual(["a", "b"]);
  });

  it("treats string content like text", () => {
    const blocks = [text("a", "hello"), { id: "b", type: "paragraph", content: "  " } as any];
    expect(removeTrailingEmptyBlocks(blocks).map((b: any) => b.id)).toEqual(["a"]);
  });

  it("never removes a trailing block that is not a paragraph", () => {
    const image = { id: "b", type: "image", props: { url: "x" } } as any;
    expect(removeTrailingEmptyBlocks([text("a", "hello"), image]).map((b: any) => b.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the input", () => {
    const blocks = [text("a", "hello"), empty("b")];
    removeTrailingEmptyBlocks(blocks);
    expect(blocks).toHaveLength(2);
  });
});
