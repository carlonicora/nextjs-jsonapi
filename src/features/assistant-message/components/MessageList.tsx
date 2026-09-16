"use client";

import type { RefObject } from "react";
import { AssistantMessageInterface } from "../data/AssistantMessageInterface";
import { MessageItem, type ApprovalActionRenderer, type MentionRenderer } from "./MessageItem";

interface Props {
  messages: AssistantMessageInterface[];
  onSelectFollowUp: (q: string) => void;
  failedMessageIds?: Set<string>;
  onRetry?: (tempId: string) => void;
  renderApprovalAction?: ApprovalActionRenderer;
  renderMention?: MentionRenderer;
  lastMessageRef?: RefObject<HTMLDivElement | null>;
}

export function MessageList({
  messages,
  onSelectFollowUp,
  failedMessageIds,
  onRetry,
  renderApprovalAction,
  renderMention,
  lastMessageRef,
}: Props) {
  const ordered = [...messages].sort((a, b) => a.position - b.position);

  let lastAssistantIndex = -1;
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (ordered[i].role === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-y-3">
      {ordered.map((m, i) => (
        <div key={m.id} ref={i === ordered.length - 1 ? lastMessageRef : undefined} className="flex min-w-0 flex-col">
          <MessageItem
            message={m}
            isLatestAssistant={i === lastAssistantIndex}
            onSelectFollowUp={onSelectFollowUp}
            failedMessageIds={failedMessageIds}
            onRetry={onRetry}
            renderApprovalAction={renderApprovalAction}
            renderMention={renderMention}
          />
        </div>
      ))}
    </div>
  );
}
