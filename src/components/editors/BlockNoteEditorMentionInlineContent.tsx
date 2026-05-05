"use client";

import { Link } from "@/shadcnui";
import { createReactInlineContentSpec } from "@blocknote/react";
import React from "react";

export interface MentionResolveResult {
  url: string;
  name: string;
}

export type MentionResolveFn = (id: string, entityType: string, alias: string) => MentionResolveResult | null;

export const createMentionInlineContentSpec = (resolveFn?: MentionResolveFn) =>
  createReactInlineContentSpec(
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
      render: (props) => {
        const alias = props.inlineContent.props.alias;
        const id = props.inlineContent.props.id;
        const entityType = props.inlineContent.props.entityType;

        if (resolveFn) {
          const resolved = resolveFn(id, entityType, alias);
          if (resolved) {
            return (
              <Link
                href={resolved.url}
                className="text-primary"
                style={{ textDecoration: "none" }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                @{resolved.name || alias}
              </Link>
            );
          }
        }

        return (
          <span className="text-primary" style={{ textDecoration: "none" }}>
            @{alias}
          </span>
        );
      },
    },
  );
