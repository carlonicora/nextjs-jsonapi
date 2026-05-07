"use client";

import { createReactInlineContentSpec } from "@blocknote/react";
import Link from "next/link";
import React from "react";

export interface MentionHoverCardProps {
  id: string;
  entityType: string;
  alias: string;
}

export interface MentionResolveResult {
  url: string;
  name: string;
  HoverCardContent?: React.ComponentType<MentionHoverCardProps>;
}

export type MentionResolveFn = (id: string, entityType: string, alias: string) => MentionResolveResult | null;

export const createMentionInlineContentSpec = (resolveFn?: MentionResolveFn) => {
  const Mention = React.memo(function Mention({ id, entityType, alias }: MentionHoverCardProps) {
    const resolved = resolveFn?.(id, entityType, alias);
    const href = resolved?.url ?? "#";

    return (
      <Link
        href={href}
        className="text-primary"
        data-mention-id={id}
        data-mention-type={entityType}
        data-mention-alias={alias}
      >
        @{alias}
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
