import type { PartialBlock } from "@blocknote/core";
import { runWithServerEditor } from "./serverEditor";

/**
 * Renders a BlockNote blocks array to the HTML the editor itself would render,
 * through BlockNote's own server editor (`blocksToFullHTML`). Server only.
 */
export function renderBlockNoteHTML(blocks: PartialBlock[]): Promise<string> {
  return runWithServerEditor((editor) => editor.blocksToFullHTML(blocks));
}
