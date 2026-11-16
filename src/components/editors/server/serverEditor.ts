import { ServerBlockNoteEditor } from "@blocknote/server-util";
import { getDocument } from "@blocknote/server-util/dom";

// Default schema only, the same one BlockNoteViewer uses: the editor's mention
// and diff inline specs are React specs from "use client" modules (next/link,
// hover cards), so they cannot run here.
let editor: ServerBlockNoteEditor | undefined;

// ServerBlockNoteEditor (0.57+) needs a document with a window. Given its own
// JSDOM document, it assigns that window and document to globalThis on the
// first HTML/Markdown call when they are undefined, and never removes them.
// Left there, every later `typeof window` check on the server would see a
// browser. Each call below removes the globals it found absent, and calls run
// one at a time so one call can never remove the globals another is using.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs `fn` with the shared server editor, one call at a time. Server only.
 * Internal to the library: not exported from the barrel.
 */
export function runWithServerEditor<T>(fn: (editor: ServerBlockNoteEditor) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const hadWindow = "window" in globalThis;
    const hadDocument = "document" in globalThis;
    try {
      editor ??= ServerBlockNoteEditor.create({}, getDocument());
      return await fn(editor);
    } finally {
      if (!hadWindow) delete (globalThis as { window?: unknown }).window;
      if (!hadDocument) delete (globalThis as { document?: unknown }).document;
    }
  });
  queue = run.catch(() => undefined);
  return run;
}
