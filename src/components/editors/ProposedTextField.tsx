"use client";

import type { PartialBlock } from "@blocknote/core";
import { Input, Textarea } from "../../shadcnui";
import { cn } from "../../utils/cn";
import type { BlockNoteEditorProps } from "./BlockNoteEditor";
import { BlockNoteEditorContainer } from "./BlockNoteEditorContainer";

/**
 * Rich text set in a field, aligned with a one-line field above it: BlockNote's side gutter (the
 * editor's inline padding, kept for its block handles, which this field never shows) is dropped,
 * the box takes the one-line field's padding, and the empty trailing line BlockNote keeps after
 * the last block is hidden.
 */
export const PROPOSED_EDITABLE_TEXT_CLASS =
  "[&_.bn-container]:!px-2 [&_.bn-container]:!py-1.5 [&_.bn-editor]:!px-0 [&_.bn-trailing-block]:hidden";
/** The same rich text, read-only: the text without the field. */
export const PROPOSED_READ_ONLY_TEXT_CLASS = "[&_.bn-editor]:!px-0 [&_.bn-trailing-block]:hidden";

/** The @ mention props, named as on `BlockNoteEditorContainer`. */
export type ProposedTextFieldMentionProps = Pick<
  BlockNoteEditorProps,
  | "mentionSearchFn"
  | "mentionSearchParams"
  | "mentionResolveFn"
  | "suggestionMenuComponent"
  | "mentionNameResolver"
  | "onWarmMentions"
>;

type ProposedTextFieldCommonProps = ProposedTextFieldMentionProps & {
  /** DOM id (the rich-text editor's id). */
  id: string;
  placeholder?: string;
  "aria-label"?: string;
  /** On the input for a one-line value; on the editor's wrapper for rich text. */
  "data-testid"?: string;
  /** Extra classes on the input, or on the editor's wrapper for rich text. */
  className?: string;
};

/** A plain text value: one line (`Input`) or, with `multiline`, a plain box (`Textarea`). */
export type ProposedTextFieldTextProps = ProposedTextFieldCommonProps & {
  variant: "text";
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
};

/** A BlockNote value: the bordered editor, or the read-only text with `readOnly`. */
export type ProposedTextFieldRichTextProps = ProposedTextFieldCommonProps & {
  variant: "richtext";
  /** Editor `type` (the storage folder of the entity type). */
  type: string;
  /** The blocks. Keep the reference stable: a new document reloads the editor. */
  initialContent: unknown[];
  /** Each edit: the blocks and whether the editor holds no text. Not called on mount. */
  onChange?: (blocks: unknown[], isEmpty: boolean) => void;
  readOnly?: boolean;
};

export type ProposedTextFieldProps = ProposedTextFieldTextProps | ProposedTextFieldRichTextProps;

/**
 * One proposed value the user can edit before accepting it: a short text as a one-line field, a
 * rich text as the bordered BlockNote editor with @ mentions; and the read-only rich text.
 */
export function ProposedTextField(props: ProposedTextFieldProps) {
  const {
    id,
    placeholder,
    className,
    mentionSearchFn,
    mentionSearchParams,
    mentionResolveFn,
    suggestionMenuComponent,
    mentionNameResolver,
    onWarmMentions,
  } = props;
  const ariaLabel = props["aria-label"];
  const testId = props["data-testid"];

  if (props.variant === "text") {
    if (props.multiline)
      return (
        <Textarea
          id={id}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn("min-h-8 min-w-0 text-sm md:text-sm", className)}
          data-testid={testId}
        />
      );
    return (
      <Input
        id={id}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn("h-8 min-w-0 text-sm font-medium", className)}
        data-testid={testId}
      />
    );
  }

  const mentions = {
    enableMentions: mentionSearchFn !== undefined || mentionResolveFn !== undefined,
    mentionSearchFn,
    mentionSearchParams,
    mentionResolveFn,
    suggestionMenuComponent,
    mentionNameResolver,
    onWarmMentions,
  };
  const { onChange } = props;

  if (props.readOnly)
    return (
      <div data-testid={testId} role={ariaLabel ? "group" : undefined} aria-label={ariaLabel} className={className}>
        <BlockNoteEditorContainer
          id={id}
          type={props.type}
          initialContent={props.initialContent as PartialBlock[]}
          className={PROPOSED_READ_ONLY_TEXT_CLASS}
          {...mentions}
        />
      </div>
    );

  return (
    <div data-testid={testId} role={ariaLabel ? "group" : undefined} aria-label={ariaLabel} className={className}>
      <BlockNoteEditorContainer
        id={id}
        type={props.type}
        initialContent={props.initialContent as PartialBlock[]}
        onChange={(blocks: unknown[], isEmpty: boolean) => onChange?.(blocks, isEmpty)}
        placeholder={placeholder}
        bordered
        disableUploads
        className={PROPOSED_EDITABLE_TEXT_CLASS}
        {...mentions}
      />
    </div>
  );
}
