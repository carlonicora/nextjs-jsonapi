"use client";

import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FC, type KeyboardEvent } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import { SuggestionMenu } from "@blocknote/core/extensions";
import type { DefaultReactSuggestionItem, SuggestionMenuProps } from "@blocknote/react";
import type { BlockNoteSlashSuggestions } from "../../../../components/editors/BlockNoteEditor";
import { BlockNoteEditorContainer } from "../../../../components/editors/BlockNoteEditorContainer";
import type { MentionResolveFn } from "../../../../components/editors/BlockNoteEditorMentionInlineContent";
import type { MentionSearchFn } from "../../../../components/editors/BlockNoteEditorSuggestionMenuController";
import { Button } from "../../../../shadcnui";
import type { SkillInterface } from "../../../skill/data/SkillInterface";
import { SkillSuggestionMenu, type SkillSuggestionItem } from "../../../skill/components/parts/SkillSuggestionMenu";
import { filterSkills } from "../../../skill/utils/skillTrigger";
import { useAssistantContextOptional } from "../../contexts/AssistantContext";

interface Props {
  onSend: (content: string, opts: { contentBlocks: unknown[] }) => Promise<void>;
  disabled?: boolean;
  mentionSearchFn?: MentionSearchFn;
  mentionSearchParams?: Record<string, string>;
  mentionResolveFn?: MentionResolveFn;
  /**
   * Custom mention menu. Without one BlockNote renders its default menu, which
   * keys rows on the item title — duplicate entity names then collide.
   */
  suggestionMenuComponent?: FC<SuggestionMenuProps<DefaultReactSuggestionItem>>;
  /** Editor placeholder. Absent, the assistant's default placeholder text. */
  placeholder?: string;
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
 * True when the `/` that opened the menu starts a word: at the start of the
 * block or after whitespace. `and/or` or `12/03` must not offer skills.
 */
function slashStartsWord(editor: BlockNoteEditor<any, any, any>, query: string): boolean {
  const { $from } = editor.prosemirrorState.selection;
  const slashAt = $from.parentOffset - query.length - 1;
  if (slashAt <= 0) return true;
  // Inline atoms (mentions) read as a non-space placeholder.
  const before = $from.parent.textBetween(slashAt - 1, slashAt, undefined, "\ufffc");
  return before === "" || /\s/.test(before);
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
  suggestionMenuComponent,
  placeholder,
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

  // Skills apply only inside an operator-mode Assistant with at least one
  // active skill. Otherwise `/` opens no menu at all (never the editor's block-type one).
  const assistant = useAssistantContextOptional();
  const operatorMode = !!assistant?.operatorMode;
  const contextSkills = assistant?.skills;
  const refreshSkills = assistant?.refreshSkills;

  // The last list read; refreshed each time a `/` opens the menu.
  const skillsRef = useRef<SkillInterface[]>(contextSkills ?? []);
  useEffect(() => {
    skillsRef.current = contextSkills ?? [];
  }, [contextSkills]);

  // The editor the skills menu runs in, so Escape can close the menu (see handleKeyDownCapture).
  const editorRef = useRef<Parameters<BlockNoteSlashSuggestions["getItems"]>[1] | null>(null);

  // Stable identity: the editor container is memoised. Always set: the message box replaces
  // the editor's block-type `/` menu (headings, quotes...), which never belongs in a chat
  // message. With no skills to offer, `/` opens nothing and stays plain text.
  const slashSuggestions = useMemo<BlockNoteSlashSuggestions<SkillSuggestionItem>>(() => {
    return {
      suggestionMenuComponent: SkillSuggestionMenu,
      getItems: async (query, editor) => {
        editorRef.current = editor;
        const closeMenu = () => editor.getExtension(SuggestionMenu)?.closeMenu();
        if (!operatorMode || !refreshSkills) {
          closeMenu();
          return [];
        }
        if (query === "") skillsRef.current = await refreshSkills();
        if (skillsRef.current.length === 0 || !slashStartsWord(editor, query)) {
          closeMenu();
          return [];
        }
        const items: SkillSuggestionItem[] = filterSkills(skillsRef.current, query).map((skill) => ({
          id: skill.id,
          skillName: skill.name,
          title: `/${skill.name}`,
          subtext: skill.description,
          onItemClick: () => editor.insertInlineContent(`/${skill.name} `),
        }));
        // An empty menu would still hold Enter; close it so Enter sends.
        if (items.length === 0) closeMenu();
        return items;
      },
    };
  }, [operatorMode, refreshSkills]);

  // A company whose first skill was just written gets the menu without
  // reopening the screen.
  const handleFocusCapture = useCallback(() => {
    if (operatorMode && refreshSkills) void refreshSkills();
  }, [operatorMode, refreshSkills]);

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
      // Escape closes the skills menu only (spec section 8.3). Stopping the key keeps it from
      // the sheet or dialog around the box, which would close and lose the message; it also
      // keeps it from BlockNote, so the menu is closed here.
      if (event.key === "Escape") {
        if (typeof document !== "undefined" && document.querySelector('[data-testid="skill-menu"]')) {
          event.preventDefault();
          event.stopPropagation();
          editorRef.current?.getExtension(SuggestionMenu)?.closeMenu();
        }
        return;
      }
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
        <div
          className="max-h-40 min-w-0 flex-1 overflow-y-auto"
          onKeyDownCapture={handleKeyDownCapture}
          onFocusCapture={handleFocusCapture}
        >
          <BlockNoteEditorContainer
            key={resetKey}
            id={editorId}
            type="assistants"
            placeholder={placeholder ?? t("features.assistant.composer_placeholder")}
            enableMentions
            mentionSearchFn={mentionSearchFn}
            mentionSearchParams={mentionSearchParams}
            mentionResolveFn={mentionResolveFn}
            suggestionMenuComponent={suggestionMenuComponent}
            slashSuggestions={slashSuggestions}
            onChange={(content: unknown, empty: boolean) => {
              setBlocks(Array.isArray(content) ? content : []);
              setIsEmpty(empty);
            }}
            className="[&_.bn-container]:!p-0"
          />
        </div>
        <Button onClick={submit} disabled={!canSend} size="sm" className="h-8">
          <ArrowUp className="me-1 h-4 w-4" /> {t("features.assistant.send")}
        </Button>
      </div>
      <div className="text-muted-foreground text-end text-xs max-md:hidden">
        {t("features.assistant.keyboard_hint")}
      </div>
    </div>
  );
}
