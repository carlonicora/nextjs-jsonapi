"use client";

import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem, SuggestionMenuController } from "@blocknote/react";
import { autoUpdate, flip, shift } from "@floating-ui/react";
import React, { useCallback, useRef } from "react";

export interface MentionItem {
  id: string;
  name: string;
  entityType: string;
  icon?: React.ReactNode;
}

export type MentionSearchFn = (query: string, params?: Record<string, string>) => Promise<MentionItem[]>;

interface BlockNoteEditorSuggestionMenuControllerProps {
  editor: BlockNoteEditor<any, any, any>;
  mentionSearchFn: MentionSearchFn;
  mentionSearchParams?: Record<string, string>;
}

const DEBOUNCE_MS = 300;

export function BlockNoteEditorMentionSuggestionMenu({
  editor,
  mentionSearchFn,
  mentionSearchParams,
}: BlockNoteEditorSuggestionMenuControllerProps) {
  const lastQueryRef = useRef<string>("");

  const getItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      lastQueryRef.current = query;

      // Empty query (the moment `@` is typed) is served immediately so the menu
      // appears with the most-recently-updated browse list — the user sees the
      // affordance without having to guess what to type.
      if (query.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS));
        if (lastQueryRef.current !== query) return [];
      }

      try {
        const results = await mentionSearchFn(query, mentionSearchParams);
        if (lastQueryRef.current !== query) return [];
        return results.map((item) => ({
          title: item.name,
          subtext: item.entityType,
          onItemClick: () => {
            editor.insertInlineContent([
              {
                type: "mention",
                props: {
                  alias: item.name,
                  id: item.id,
                  entityType: item.entityType,
                },
              },
              " ",
            ]);
          },
        }));
      } catch {
        return [];
      }
    },
    [editor, mentionSearchFn, mentionSearchParams],
  );

  return (
    <div className="blocknote-suggestion-container" style={{ position: "static" }}>
      <SuggestionMenuController
        triggerCharacter={"@"}
        getItems={getItems}
        floatingUIOptions={{
          useFloatingOptions: {
            strategy: "fixed",
            placement: "bottom-start",
            middleware: [flip(), shift()],
            whileElementsMounted: autoUpdate,
          },
        }}
      />
    </div>
  );
}
