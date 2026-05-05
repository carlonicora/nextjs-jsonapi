"use client";

import React from "react";
import { cn } from "../../utils/cn";
import { BlockNoteEditorContainer } from "../editors/BlockNoteEditorContainer";
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
  mentionResolveFn?: (id: string, entityType: string, alias: string) => { url: string; name: string } | null;
}) {
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
        {(field) => (
          <BlockNoteEditorContainer
            id={form.getValues("id")}
            type={type}
            initialContent={field.value}
            onChange={(content, isEmpty) => {
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
            className={cn(stretch && "min-h-0 flex-1")}
          />
        )}
      </FormFieldWrapper>
    </div>
  );
}
