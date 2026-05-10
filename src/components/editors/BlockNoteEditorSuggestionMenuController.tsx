"use client";

import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem, SuggestionMenuController, SuggestionMenuProps } from "@blocknote/react";
import { autoUpdate, flip, shift } from "@floating-ui/react";
import React, { useCallback, useMemo } from "react";

export interface MentionItem {
  id: string;
  name: string;
  entityType: string;
  icon?: React.ReactNode;
}

export type MentionSearchFn = (query: string, params?: Record<string, string>) => Promise<MentionItem[]>;

export type MentionInsertFn = (id: string, name: string, entityType: string) => void;

const MentionInsertContext = React.createContext<MentionInsertFn | null>(null);
export const useMentionInsert = () => React.useContext(MentionInsertContext);

// BlockNote's SuggestionMenuController auto-closes the menu when the query
// grows more than 3 characters past the last query that returned results
// (see @blocknote/react `Xt` close-on-empty hook). That breaks multi-word
// mention queries like "@John Smith" when no exact match exists, because the
// custom suggestion UI still wants to surface a "Create" option. We work
// around it by always returning at least one item from getItems(): a sentinel
// that's filtered out before reaching the consumer's suggestion menu.
const KEEP_OPEN_SENTINEL_TITLE = "__blocknote_mention_keep_open__";

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
  const onMentionInsert = useCallback(
    (id: string, name: string, entityType: string) => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: { alias: name, id, entityType },
        },
        " ",
      ]);
    },
    [editor],
  );

  const getItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      const results = await mentionSearchFn(query, mentionSearchParams);
      const items: DefaultReactSuggestionItem[] = results.map((item) => ({
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
      if (items.length === 0) {
        items.push({ title: KEEP_OPEN_SENTINEL_TITLE, onItemClick: () => {} });
      }
      return items;
    },
    [editor, mentionSearchFn, mentionSearchParams],
  );

  const wrappedSuggestionMenuComponent = useMemo<
    React.FC<SuggestionMenuProps<DefaultReactSuggestionItem>> | undefined
  >(() => {
    if (!suggestionMenuComponent) return undefined;
    const Component = suggestionMenuComponent;
    const Wrapped: React.FC<SuggestionMenuProps<DefaultReactSuggestionItem>> = (props) => {
      const isSentinelOnly = props.items.length === 1 && props.items[0]?.title === KEEP_OPEN_SENTINEL_TITLE;
      return (
        <Component
          {...props}
          items={isSentinelOnly ? [] : props.items}
          selectedIndex={isSentinelOnly ? undefined : props.selectedIndex}
          onItemClick={(item) => {
            if (item.title === KEEP_OPEN_SENTINEL_TITLE) return;
            props.onItemClick?.(item);
          }}
        />
      );
    };
    return Wrapped;
  }, [suggestionMenuComponent]);

  return (
    <MentionInsertContext.Provider value={onMentionInsert}>
      <div className="blocknote-suggestion-container" style={{ position: "static" }}>
        <SuggestionMenuController
          triggerCharacter={"@"}
          getItems={getItems}
          suggestionMenuComponent={wrappedSuggestionMenuComponent}
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
    </MentionInsertContext.Provider>
  );
}
