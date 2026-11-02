import type { PartialBlock } from "@blocknote/core";
import { runWithServerEditor } from "./serverEditor";

/**
 * Renders a BlockNote blocks array to Markdown through BlockNote's own server
 * editor (`blocksToMarkdownLossy`). Server only.
 */
export function renderBlockNoteMarkdown(blocks: PartialBlock[]): Promise<string> {
  return runWithServerEditor((editor) => editor.blocksToMarkdownLossy(blocks));
}
