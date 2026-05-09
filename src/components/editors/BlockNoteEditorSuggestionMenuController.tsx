"use client";

import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem, SuggestionMenuController, SuggestionMenuProps } from "@blocknote/react";
import { autoUpdate, flip, shift } from "@floating-ui/react";
import React, { useCallback } from "react";

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
  suggestionMenuComponent?: React.FC<SuggestionMenuProps<DefaultReactSuggestionItem>>;
}

export function BlockNoteEditorMentionSuggestionMenu({
  editor,
  mentionSearchFn,
  mentionSearchParams,
  suggestionMenuComponent,
}: BlockNoteEditorSuggestionMenuControllerProps) {
  const getItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      const results = await mentionSearchFn(query, mentionSearchParams);
      return results.map((item) => ({
        title: item.name,
        subtext: item.entityType,
        icon: item.icon as React.ReactElement | undefined,
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
    },
    [editor, mentionSearchFn, mentionSearchParams],
  );

  return (
    <div className="blocknote-suggestion-container" style={{ position: "static" }}>
      <SuggestionMenuController
        triggerCharacter={"@"}
        getItems={getItems}
        suggestionMenuComponent={suggestionMenuComponent}
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
