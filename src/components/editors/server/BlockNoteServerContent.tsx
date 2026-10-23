import type { PartialBlock } from "@blocknote/core";
import "@blocknote/shadcn/style.css";
// Imported through the package's own client subpath, like the analytics server
// pages: the built server entry must reach the viewer through the "use client"
// bundle, not inline it.
import { BlockNoteStaticViewer } from "@carlonicora/nextjs-jsonapi/components";
import { renderBlockNoteHTML } from "./renderBlockNoteHTML";

/**
 * Read-only rich text rendered on the server, so the text is in the HTML that
 * crawlers read. For public read-only pages only: everywhere else, display goes
 * through BlockNoteEditorContainer.
 */
export async function BlockNoteServerContent({
  content,
  size,
  className,
}: {
  content?: PartialBlock[];
  size?: "default" | "sm";
  className?: string;
}) {
  if (!Array.isArray(content) || content.length === 0) return null;

  const html = await renderBlockNoteHTML(content);

  return <BlockNoteStaticViewer html={html} size={size} className={className} />;
}
