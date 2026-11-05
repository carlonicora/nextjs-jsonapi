import type { BlockNoteEditorOptions, PartialBlock } from "@blocknote/core";
import * as coreLocales from "@blocknote/core/locales";
import { type CollaborationOptions, withCollaboration } from "@blocknote/core/yjs";

/**
 * Live co-editing options for the shared editor: `{ fragment, user: { name, color }, provider?, showCursorLabels? }`.
 * BlockNote 0.55 no longer reads `collaboration` from the editor options; it is applied through
 * `withCollaboration()` from `@blocknote/core/yjs`, which this module does.
 */
export type BlockNoteCollaboration = CollaborationOptions;

export type BuildBlockNoteEditorOptionsParams = {
  placeholder: string;
  schema: any;
  /** The validated initial content. Ignored when `collaboration` is set: the Yjs document is the content. */
  initialContent: PartialBlock[] | undefined;
  uploadFile: (file: File) => Promise<string>;
  /** true: no image uploads (no `uploadFile`, so BlockNote offers no upload). */
  disableUploads?: boolean;
  aiExtension: any;
  coreDictionary: typeof coreLocales.en;
  aiDictionary: any;
  collaboration?: BlockNoteCollaboration;
};

/**
 * The options handed to `useCreateBlockNote`. Without `collaboration` they are exactly the options the
 * editor has always built; with it, BlockNote's `withCollaboration` adds the collaboration extension,
 * disables the local history (Yjs owns undo) and replaces `initialContent` with its fixed placeholder.
 */
export function buildBlockNoteEditorOptions(
  params: BuildBlockNoteEditorOptionsParams,
): Partial<BlockNoteEditorOptions<any, any, any>> {
  const { aiExtension, coreDictionary, aiDictionary, collaboration } = params;

  const options: Partial<BlockNoteEditorOptions<any, any, any>> = {
    placeholders: {
      emptyDocument: params.placeholder,
    },
    schema: params.schema,
    uploadFile: params.disableUploads ? undefined : params.uploadFile,
    extensions: aiExtension ? [aiExtension] : undefined,
    dictionary: aiExtension
      ? { ...coreDictionary, ai: aiDictionary }
      : coreDictionary === coreLocales.en
        ? undefined
        : coreDictionary,
  };

  if (collaboration) return withCollaboration({ ...options, collaboration });

  return { ...options, initialContent: params.initialContent };
}

/** An explicit `editable` wins; otherwise the editor is editable when it reports changes. */
export function resolveEditable(params: { editable?: boolean; onChange?: unknown }): boolean {
  return params.editable !== undefined ? params.editable : params.onChange !== undefined;
}

/** A paragraph with no visible inline content (a mention or a link is content) and no non-empty nested blocks. */
export function isBlockEmpty(block: any): boolean {
  if (!block || typeof block !== "object") return true;
  if (block.type !== "paragraph") return false;
  if (Array.isArray(block.children) && block.children.length > 0 && !isDocumentEmpty(block.children)) {
    return false;
  }
  if (Array.isArray(block.content)) {
    for (const inline of block.content) {
      if (typeof inline === "string") {
        if (inline.trim()) return false;
      } else if (inline && typeof inline === "object") {
        if (inline.type !== "text") return false;
        if (typeof inline.text === "string" && inline.text.trim()) return false;
      }
    }
  } else if (typeof block.content === "string" && block.content.trim()) {
    return false;
  }
  return true;
}

export function isDocumentEmpty(blocks: any[]): boolean {
  if (!Array.isArray(blocks) || blocks.length === 0) return true;
  return blocks.every(isBlockEmpty);
}

/**
 * Read-only display: drops the trailing empty paragraphs BlockNote leaves behind, keeping at least
 * one block. Uses `isBlockEmpty`: a paragraph holding only a mention or a link, or non-empty nested blocks, is kept.
 * Never mutates the input.
 */
export function removeTrailingEmptyBlocks(blocks: PartialBlock[]): PartialBlock[] {
  if (!blocks || blocks.length === 0) return blocks;
  const result = [...blocks];
  while (result.length > 1 && isBlockEmpty(result[result.length - 1])) result.pop();
  return result;
}
