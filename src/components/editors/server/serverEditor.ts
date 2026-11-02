import { ServerBlockNoteEditor } from "@blocknote/server-util";

// Default schema only, the same one BlockNoteViewer uses: the editor's mention
// and diff inline specs are React specs from "use client" modules (next/link,
// hover cards), so they cannot run here.
let editor: ServerBlockNoteEditor | undefined;

// ServerBlockNoteEditor swaps globalThis.window/document for its JSDOM around
// each call and restores them after an await. Two overlapping calls would
// restore each other's values and could leave the JSDOM window on the server's
// globals, so calls run one at a time.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs `fn` with the shared server editor, one call at a time. Server only.
 * Internal to the library: not exported from the barrel.
 */
export function runWithServerEditor<T>(fn: (editor: ServerBlockNoteEditor) => T | Promise<T>): Promise<T> {
  const run = queue.then(() => {
    editor ??= ServerBlockNoteEditor.create();
    return fn(editor);
  });
  queue = run.catch(() => undefined);
  return run;
}
