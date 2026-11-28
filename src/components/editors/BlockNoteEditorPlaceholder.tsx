"use client";

import React from "react";
import { cn } from "../../utils/cn";
import type { BlockNoteEditorProps } from "./BlockNoteEditor";

type PlaceholderBlock = {
  type?: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: PlaceholderBlock[];
};

/** The visible text of one inline item: text, a link's text, or a mention's name. */
function inlineText(item: unknown): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  const node = item as { type?: string; text?: unknown; content?: unknown; props?: Record<string, unknown> };
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) return node.content.map(inlineText).join("");
  const props = node.props ?? {};
  for (const key of ["alias", "name", "label", "title"])
    if (typeof props[key] === "string") return props[key] as string;
  return "";
}

function blockText(block: PlaceholderBlock): string {
  if (typeof block.content === "string") return block.content;
  return Array.isArray(block.content) ? block.content.map(inlineText).join("") : "";
}

const HEADING_CLASS: Record<number, string> = {
  1: "text-2xl font-bold",
  2: "text-xl font-bold",
  3: "text-lg font-bold",
};

function PlaceholderBlocks({ blocks }: { blocks: PlaceholderBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const level = Number(block.props?.level ?? 0);
        const marker =
          block.type === "bulletListItem"
            ? "• "
            : block.type === "numberedListItem"
              ? `${index + 1}. `
              : block.type === "checkListItem"
                ? "☐ "
                : "";
        return (
          <div key={index}>
            {/* BlockNote gives every block 3px above and below; empty blocks keep one line. */}
            <div
              className={cn(
                "py-[3px] break-words whitespace-pre-wrap",
                block.type === "heading" && HEADING_CLASS[level],
              )}
            >
              {marker}
              {blockText(block) || " "}
            </div>
            {block.children && block.children.length > 0 ? (
              <div className="ps-6">
                <PlaceholderBlocks blocks={block.children} />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

/**
 * What a BlockNote field shows while its editor code loads: the same text, wrapper, padding and
 * text size, read-only, so the field already takes about its final height. Without it the field
 * is empty until the editor arrives, then grows and pushes everything below it down.
 */
export function BlockNoteEditorPlaceholder(props: BlockNoteEditorProps) {
  // The editor's own rule (resolveEditable), repeated here: its module loads BlockNote, which this file must not.
  const isEditable = props.editable !== undefined ? props.editable : props.onChange !== undefined;
  const blocks = (props.diffContent ?? props.initialContent ?? []) as PlaceholderBlock[];
  const markdownLines = blocks.length === 0 && props.markdownContent ? props.markdownContent.split("\n") : [];
  const isEmpty = blocks.length === 0 && markdownLines.length === 0;

  return (
    <div
      aria-busy="true"
      data-blocknote-placeholder=""
      className={cn(
        props.bordered ? "rounded-md border border-input bg-input/20 dark:bg-input/30" : "",
        "flex w-full flex-col leading-normal",
        isEditable ? "p-4 max-md:text-base md:text-sm" : "text-sm",
        props.className,
      )}
    >
      {isEmpty ? (
        <div className="text-muted-foreground py-[3px]">
          {isEditable && props.placeholder ? props.placeholder : " "}
        </div>
      ) : markdownLines.length > 0 ? (
        markdownLines.map((line, index) => (
          <div key={index} className="py-[3px] break-words whitespace-pre-wrap">
            {line || " "}
          </div>
        ))
      ) : (
        <PlaceholderBlocks blocks={blocks} />
      )}
    </div>
  );
}
