"use client";

import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem, SuggestionMenuController, SuggestionMenuProps } from "@blocknote/react";
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

function MentionSuggestionMenu(props: SuggestionMenuProps<DefaultReactSuggestionItem>) {
  if (props.items.length === 0) return null;

  return (
    <div className="z-50 max-h-80 min-w-80 overflow-auto rounded-md border bg-popover p-1 shadow-md">
      {props.items.map((item, index) => (
        <div
          key={item.title + item.subtext}
          className={`flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm ${
            index === props.selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
          }`}
          onClick={() => props.onItemClick?.(item)}
        >
          <div className="flex-1">
            <div className="font-medium">{item.title}</div>
            <div className="text-xs text-muted-foreground">{item.subtext}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BlockNoteEditorMentionSuggestionMenu({
  editor,
  mentionSearchFn,
  mentionSearchParams,
}: BlockNoteEditorSuggestionMenuControllerProps) {
  const lastQueryRef = useRef<string>("");

  const getItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      if (!query || query.length === 0) return [];

      lastQueryRef.current = query;
      await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS));
      if (lastQueryRef.current !== query) return [];

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
    <SuggestionMenuController
      triggerCharacter={"@"}
      getItems={getItems}
      suggestionMenuComponent={MentionSuggestionMenu}
    />
  );
}
