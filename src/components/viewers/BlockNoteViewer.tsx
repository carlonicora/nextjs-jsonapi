"use client";

import { useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
// Mirror BlockNoteEditor.tsx's BlockNoteView import + style.css. Default schema
// only — no useCurrentUserContext, uploadImage, AI, or custom inline specs, so
// this can render on auth-free public pages.
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";

function normalize(content: unknown): PartialBlock[] | undefined {
  if (Array.isArray(content) && content.length > 0) return content as PartialBlock[];
  if (typeof content === "string" && content.trim()) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as PartialBlock[];
    } catch {
      /* plain string — fall through to undefined (rendered as empty) */
    }
  }
  return undefined;
}

export function BlockNoteViewer({ content }: { content: unknown }) {
  const editor = useCreateBlockNote({ initialContent: normalize(content) });
  return <BlockNoteView editor={editor} editable={false} theme="light" />;
}
