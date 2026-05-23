"use client";

import React, { useRef } from "react";
import { DefaultReactSuggestionItem, SuggestionMenuProps } from "@blocknote/react";
import { cn } from "../../utils/cn";
import { BlockNoteEditorContainer } from "../editors/BlockNoteEditorContainer";
import type { MentionNameResolver, MentionResolveFn } from "../editors/BlockNoteEditorMentionInlineContent";
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormBlockNote({
  form,
  id,
  name,
  placeholder,
  type,
  isRequired = false,
  description,
  testId,
  onEmptyChange,
  inlineContentSpecs,
  renderOverlays,
  className,
  stretch = false,
  enableMentions,
  mentionSearchFn,
  mentionSearchParams,
  mentionResolveFn,
  suggestionMenuComponent,
  mentionNameResolver,
  onWarmMentions,
  aiConfig,
}: {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  type: string;
  isRequired?: boolean;
  description?: string;
  testId?: string;
  onEmptyChange?: (isEmpty: boolean) => void;
  inlineContentSpecs?: Record<string, any>;
  renderOverlays?: (editor: any) => React.ReactNode;
  className?: string;
  /**
   * When true, the field grows to fill available vertical space in a flex-col parent.
   * Applies flex-1 + min-h-0 to the outer wrapper, the inner Field, and the editor.
   */
  stretch?: boolean;
  enableMentions?: boolean;
  mentionSearchFn?: (
    query: string,
    params?: Record<string, string>,
  ) => Promise<import("../editors/BlockNoteEditorSuggestionMenuController").MentionItem[]>;
  mentionSearchParams?: Record<string, string>;
  mentionResolveFn?: MentionResolveFn;
  suggestionMenuComponent?: React.FC<SuggestionMenuProps<DefaultReactSuggestionItem>>;
  mentionNameResolver?: MentionNameResolver;
  onWarmMentions?: (blocks: any[]) => void;
  aiConfig?: import("../editors/BlockNoteEditor").BlockNoteAiConfig;
}) {
  const initialContentRef = useRef<any>(null);
  const lastEditorContentRef = useRef<any>(undefined);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        stretch && "min-h-0 flex-1 [&>[data-slot=field]]:min-h-0 [&>[data-slot=field]]:flex-1",
        className,
      )}
    >
      <FormFieldWrapper
        form={form}
        name={id}
        label={name}
        isRequired={isRequired}
        description={description}
        testId={testId}
      >
        {(field) => {
          const isInternalChange =
            lastEditorContentRef.current !== undefined && field.value === lastEditorContentRef.current;

          if (!isInternalChange) {
            initialContentRef.current = field.value;
          }

          return (
            <BlockNoteEditorContainer
              id={form.getValues("id")}
              type={type}
              initialContent={initialContentRef.current}
              onChange={(content, isEmpty) => {
                lastEditorContentRef.current = content;
                field.onChange(content);
                onEmptyChange?.(isEmpty);
              }}
              placeholder={placeholder}
              bordered
              inlineContentSpecs={inlineContentSpecs}
              renderOverlays={renderOverlays}
              enableMentions={enableMentions}
              mentionSearchFn={mentionSearchFn}
              mentionSearchParams={mentionSearchParams}
              mentionResolveFn={mentionResolveFn}
              suggestionMenuComponent={suggestionMenuComponent}
              mentionNameResolver={mentionNameResolver}
              onWarmMentions={onWarmMentions}
              aiConfig={aiConfig}
              stretch={stretch}
              className={cn(stretch && "min-h-0 flex-1")}
            />
          );
        }}
      </FormFieldWrapper>
    </div>
  );
}
