// @vitest-environment node
// The server render runs in Node, where there is no window or document of our own:
// BlockNote's ServerBlockNoteEditor brings its JSDOM.
import type { PartialBlock } from "@blocknote/core";
import { describe, expect, it } from "vitest";
import { renderBlockNoteHTML } from "../renderBlockNoteHTML";

const blocks: PartialBlock[] = [
  { type: "heading", props: { level: 2 }, content: "Prep situations" },
  {
    type: "paragraph",
    content: [
      { type: "text", text: "A scene that can go ", styles: {} },
      { type: "text", text: "three ways", styles: { bold: true } },
    ],
  },
  { type: "bulletListItem", content: "First clue" },
  { type: "bulletListItem", content: "Second clue" },
  {
    type: "paragraph",
    content: [{ type: "link", href: "https://example.com/guide", content: "Read the guide" }],
  },
];

describe("renderBlockNoteHTML", () => {
  it("renders the blocks' text into HTML on the server", async () => {
    const html = await renderBlockNoteHTML(blocks);

    expect(html).toContain("Prep situations");
    expect(html).toMatch(/<h2[^>]*>.*Prep situations.*<\/h2>/s);
    expect(html).toMatch(/<strong[^>]*>three ways<\/strong>/);
    expect(html).toContain("First clue");
    expect(html).toContain("Second clue");
    expect(html).toContain('href="https://example.com/guide"');
    expect(html).toContain("Read the guide");
  });

  it("leaves the server globals as they were", async () => {
    await Promise.all([renderBlockNoteHTML(blocks), renderBlockNoteHTML(blocks)]);

    expect(typeof (globalThis as { window?: unknown }).window).toBe("undefined");
    expect(typeof (globalThis as { document?: unknown }).document).toBe("undefined");
  });
});
