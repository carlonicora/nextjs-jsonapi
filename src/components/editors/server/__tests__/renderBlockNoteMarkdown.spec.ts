// @vitest-environment node
// The server render runs in Node, where there is no window or document of our own:
// BlockNote's ServerBlockNoteEditor brings its JSDOM.
import type { PartialBlock } from "@blocknote/core";
import { describe, expect, it } from "vitest";
import { renderBlockNoteHTML } from "../renderBlockNoteHTML";
import { renderBlockNoteMarkdown } from "../renderBlockNoteMarkdown";

const blocks: PartialBlock[] = [
  { type: "heading", props: { level: 2 }, content: "Think of the Campaign as the lid on the box" },
  { type: "paragraph", content: "One Campaign is one story arc." },
  { type: "bulletListItem", content: "Characters" },
  {
    type: "paragraph",
    content: [{ type: "link", href: "https://wyrd.li/help", content: "help" }],
  },
  { type: "image", props: { url: "https://wyrd.li/marketing/og.png", caption: "Wyrdli" } },
  { type: "image", props: { url: "https://wyrd.li/marketing/plain.png" } },
];

describe("renderBlockNoteMarkdown", () => {
  it("renders headings, paragraphs, bullet lists and links", async () => {
    const markdown = await renderBlockNoteMarkdown(blocks);

    expect(markdown).toContain("## Think of the Campaign as the lid on the box");
    expect(markdown).toContain("One Campaign is one story arc.");
    expect(markdown).toMatch(/^\s*[-*+] Characters\s*$/m);
    expect(markdown).toContain("[help](https://wyrd.li/help)");
    // blocksToMarkdownLossy keeps a captioned image as an HTML <figure> (valid
    // CommonMark HTML block); an image with no caption becomes ![](url).
    expect(markdown).toMatch(/<img[^>]*src="https:\/\/wyrd\.li\/marketing\/og\.png"/);
    expect(markdown).toContain("<figcaption>Wyrdli</figcaption>");
    expect(markdown).toMatch(/!\[[^\]]*\]\(https:\/\/wyrd\.li\/marketing\/plain\.png\)/);
  });

  it("two overlapping calls both resolve and leave no JSDOM window on globalThis", async () => {
    const before = typeof (globalThis as { window?: unknown }).window;

    const [markdown, html] = await Promise.all([renderBlockNoteMarkdown(blocks), renderBlockNoteHTML(blocks)]);

    expect(markdown).toContain("One Campaign is one story arc.");
    expect(html).toContain("One Campaign is one story arc.");
    expect(typeof (globalThis as { window?: unknown }).window).toBe(before);
  });
});
