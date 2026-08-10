"use client";

import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useId, useState, type KeyboardEvent } from "react";
import { BlockNoteEditorContainer } from "../../../../components/editors/BlockNoteEditorContainer";
import type { MentionResolveFn } from "../../../../components/editors/BlockNoteEditorMentionInlineContent";
import type { MentionItem } from "../../../../components/editors/BlockNoteEditorSuggestionMenuController";
import { Button } from "../../../../shadcnui";

interface Props {
  onSend: (content: string, opts: { contentBlocks: unknown[] }) => Promise<void>;
  disabled?: boolean;
  mentionSearchFn?: (query: string, params?: Record<string, string>) => Promise<MentionItem[]>;
  mentionSearchParams?: Record<string, string>;
  mentionResolveFn?: MentionResolveFn;
}

/**
 * Flattens a BlockNote document to a single plain-text string. This is only a
 * FALLBACK for the server, which re-derives the stored text from the blocks it
 * receives — the blocks are the source of truth, never this string.
 */
function flattenBlocks(blocks: unknown[]): string {
  const lines: string[] = [];

  const readInline = (inline: unknown): string => {
    if (typeof inline === "string") return inline;
    if (!inline || typeof inline !== "object") return "";
    const node = inline as { type?: string; text?: string; props?: { alias?: string }; content?: unknown };
    if (node.type === "mention") return node.props?.alias ?? "";
    if (typeof node.text === "string") return node.text;
    if (Array.isArray(node.content)) return node.content.map(readInline).join("");
    return "";
  };

  const readBlock = (block: unknown): void => {
    if (!block || typeof block !== "object") return;
    const node = block as { content?: unknown; children?: unknown };
    if (Array.isArray(node.content)) {
      const line = node.content.map(readInline).join("").trim();
      if (line) lines.push(line);
    } else if (typeof node.content === "string" && node.content.trim()) {
      lines.push(node.content.trim());
    }
    if (Array.isArray(node.children)) node.children.forEach(readBlock);
  };

  blocks.forEach(readBlock);
  return lines.join("\n");
}

/**
 * Mention-capable chat composer. Unlike `AssistantComposer` (plain textarea) it
 * sends the BlockNote document alongside the flattened text, so the server can
 * resolve `@`-mentions to real entities and pin them into the agent's focus.
 */
export function AssistantBlockNoteComposer({
  onSend,
  disabled,
  mentionSearchFn,
  mentionSearchParams,
  mentionResolveFn,
}: Props) {
  const t = useTranslations();
  // React's generated ids carry delimiters (`:r0:` / `«r0»`) and this value ends
  // up inside an S3 object key, so keep it to path-safe characters.
  const editorId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [blocks, setBlocks] = useState<unknown[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);
  // Remounting the editor is the only reliable way to clear it: the editor
  // ignores an `initialContent` that merely echoes what it last emitted.
  const [resetKey, setResetKey] = useState(0);

  const canSend = !isEmpty && !disabled;

  const submit = useCallback(async () => {
    if (isEmpty || disabled) return;
    const payload = blocks;
    const plainText = flattenBlocks(payload);
    setBlocks([]);
    setIsEmpty(true);
    setResetKey((previous) => previous + 1);
    await onSend(plainText, { contentBlocks: payload });
  }, [blocks, disabled, isEmpty, onSend]);

  const handleKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      // The mention suggestion menu claims Enter with a CAPTURING document
      // listener of its own. If we preventDefault here the highlighted mention
      // is never inserted, so stand down whenever the menu is on screen.
      if (typeof document !== "undefined" && document.querySelector(".bn-suggestion-menu")) return;
      event.preventDefault();
      void submit();
    },
    [submit],
  );

  return (
    <div className="flex flex-col gap-1 border-t p-4">
      <div className="bg-muted/30 flex items-end gap-2 rounded-lg border p-2">
        <div className="max-h-40 min-w-0 flex-1 overflow-y-auto" onKeyDownCapture={handleKeyDownCapture}>
          <BlockNoteEditorContainer
            key={resetKey}
            id={editorId}
            type="assistants"
            placeholder={t("features.assistant.composer_placeholder")}
            enableMentions
            mentionSearchFn={mentionSearchFn}
            mentionSearchParams={mentionSearchParams}
            mentionResolveFn={mentionResolveFn}
            onChange={(content: unknown, empty: boolean) => {
              setBlocks(Array.isArray(content) ? content : []);
              setIsEmpty(empty);
            }}
            className="[&_.bn-container]:!p-0"
          />
        </div>
        <Button onClick={submit} disabled={!canSend} size="sm" className="h-8">
          <ArrowUp className="mr-1 h-4 w-4" /> {t("features.assistant.send")}
        </Button>
      </div>
      <div className="text-muted-foreground text-right text-xs">{t("features.assistant.keyboard_hint")}</div>
    </div>
  );
}
