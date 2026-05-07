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

/** Spread on the root element of a custom Inline so the hovercard can detect hover. */
export const mentionDataAttrs = (p: MentionRenderProps) => ({
  "data-mention-id": p.id,
  "data-mention-type": p.entityType,
  "data-mention-alias": p.alias,
});

export const createMentionInlineContentSpec = (resolveFn?: MentionResolveFn) => {
  const Mention = React.memo(function Mention(props: MentionRenderProps) {
    const resolved = resolveFn?.(props.id, props.entityType, props.alias);

    if (resolved?.Inline) {
      const Custom = resolved.Inline;
      return <Custom {...props} />;
    }

    const href = resolved?.url ?? "#";
    const handleClick = resolved?.onActivate ? (e: React.MouseEvent) => resolved.onActivate!(e, props) : undefined;

    return (
      <Link href={href} className="text-primary" onClick={handleClick} {...mentionDataAttrs(props)}>
        @{props.alias}
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
    },
  );
};
