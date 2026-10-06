"use client";

import React, { useRef } from "react";
import { DefaultReactSuggestionItem, SuggestionMenuProps } from "@blocknote/react";
import { cn } from "../../utils/cn";
import { BlockNoteEditorContainer } from "../editors/BlockNoteEditorContainer";
import type { MentionNameResolver, MentionResolveFn } from "../editors/BlockNoteEditorMentionInlineContent";
import { FormFieldWrapper } from "./FormFieldWrapper";

function isEmptyDocument(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function getPath(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), source);
}

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
  aiHandleRef,
  headerAction,
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
  /** Filled by the editor so a control outside it can run an AI action. */
  aiHandleRef?: React.MutableRefObject<import("../editors/BlockNoteEditor").BlockNoteAiHandle | null>;
  /** Rendered on the label row, right-aligned — e.g. a "Suggest impression" button. */
  headerAction?: React.ReactNode;
}) {
  const initialContentRef = useRef<any>(null);
  const lastEditorContentRef = useRef<any>(undefined);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        stretch && "min-h-0 flex-1 [&>[data-slot=field]]:min-h-0 [&>[data-slot=field]]:flex-1",
        // Phone: the sheet is too short to share with the other fields, so the
        // editor stops filling the leftover space (2px in a long form) and grows
        // with its content instead; the sheet body does the scrolling.
        stretch && "max-md:min-h-64 max-md:flex-none",
        className,
      )}
    >
      <FormFieldWrapper
        form={form}
        name={id}
        label={name}
        labelAction={headerAction}
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
                // BlockNote normalises an empty document ([] / null) to one empty
                // paragraph as soon as it mounts. That is not a user edit: re-seed the
                // field's default with it so an untouched form does not ask
                // "Unsaved changes?" on close.
                if (
                  isEmpty &&
                  isEmptyDocument(getPath(form.formState.defaultValues, id)) &&
                  !form.getFieldState(id).isDirty
                ) {
                  form.resetField(id, { defaultValue: content });
                } else {
                  field.onChange(content);
                }
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
              aiHandleRef={aiHandleRef}
              stretch={stretch}
              className={cn(stretch && "min-h-0 flex-1")}
            />
          );
        }}
      </FormFieldWrapper>
    </div>
  );
}
