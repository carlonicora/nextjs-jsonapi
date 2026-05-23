"use client";

import { createReactInlineContentSpec } from "@blocknote/react";
import Link from "next/link";
import React from "react";

export interface MentionRenderProps {
  id: string;
  entityType: string;
  alias: string;
}

/** @deprecated Use MentionRenderProps. */
export type MentionHoverCardProps = MentionRenderProps;

export interface MentionResolveResult {
  /** Navigation target. Optional — without it, default Link goes to "#" and only renders text. */
  url?: string;
  name: string;
  /** Replace the entire inline element. Receives the same props as the default. Must keep the data-mention-* attributes if hovercard support is desired. */
  Inline?: React.ComponentType<MentionRenderProps>;
  /** Rendered inside the hovercard popup that opens on mouseover. */
  HoverContent?: React.ComponentType<MentionRenderProps>;
  /** Override the default Link's click behavior (e.g., open a modal/sidebar instead of navigating). */
  onActivate?: (e: React.MouseEvent, props: MentionRenderProps) => void;
}

export type MentionResolveFn = (id: string, entityType: string, alias: string) => MentionResolveResult | null;

export type MentionNameResolver = (id: string, entityType: string, alias: string) => string;

/** Spread on the root element of a custom Inline so the hovercard can detect hover. */
export const mentionDataAttrs = (p: MentionRenderProps) => ({
  "data-mention-id": p.id,
  "data-mention-type": p.entityType,
  "data-mention-alias": p.alias,
});

export const parseMentionElement = (
  element: HTMLElement,
): { id: string; entityType: string; alias: string } | undefined => {
  const id = element.getAttribute("data-mention-id");
  const entityType = element.getAttribute("data-mention-type");
  const alias = element.getAttribute("data-mention-alias");
  if (!id || !entityType || !alias) return undefined;
  return { id, entityType, alias };
};

export const createMentionInlineContentSpec = (
  resolveFn?: MentionResolveFn,
  disableMention?: boolean,
  nameResolver?: MentionNameResolver,
) => {
  const MentionExternalHTML = (props: MentionRenderProps) => {
    const displayName = nameResolver?.(props.id, props.entityType, props.alias) ?? props.alias;
    return (
      <span data-mention-id={props.id} data-mention-type={props.entityType} data-mention-alias={props.alias}>
        @{displayName}
      </span>
    );
  };

  const Mention = React.memo(function Mention(props: MentionRenderProps) {
    const displayName = nameResolver?.(props.id, props.entityType, props.alias) ?? props.alias;

    if (disableMention) {
      const resolved = resolveFn?.(props.id, props.entityType, displayName);
      return (
        <Link href={resolved?.url ?? "#"} className="text-primary">
          @{displayName}
        </Link>
      );
    }

    const resolved = resolveFn?.(props.id, props.entityType, displayName);

    if (resolved?.Inline) {
      const Custom = resolved.Inline;
      return <Custom {...props} alias={displayName} />;
    }

    const href = resolved?.url ?? "#";
    const handleClick = resolved?.onActivate ? (e: React.MouseEvent) => resolved.onActivate!(e, props) : undefined;

    return (
      <Link
        href={href}
        className="text-primary"
        onClick={handleClick}
        {...mentionDataAttrs({ ...props, alias: displayName })}
      >
        @{displayName}
      </Link>
    );
  });

  return createReactInlineContentSpec(
    {
      type: "mention",
      propSchema: {
        alias: { default: "Unknown" },
        id: { default: "Unknown" },
        entityType: { default: "Unknown" },
      },
      content: "none",
    },
    {
      render: (props) => (
        <Mention
          id={props.inlineContent.props.id}
          entityType={props.inlineContent.props.entityType}
          alias={props.inlineContent.props.alias}
        />
      ),
      toExternalHTML: (props) => (
        <MentionExternalHTML
          id={props.inlineContent.props.id}
          entityType={props.inlineContent.props.entityType}
          alias={props.inlineContent.props.alias}
        />
      ),
      parse: (element) => parseMentionElement(element),
    },
  );
};
