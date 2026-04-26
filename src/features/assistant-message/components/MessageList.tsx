"use client";

import { AssistantMessageInterface } from "../data/AssistantMessageInterface";
import { MessageItem } from "./MessageItem";

interface Props {
  messages: AssistantMessageInterface[];
  onSelectFollowUp: (q: string) => void;
  failedMessageIds?: Set<string>;
  onRetry?: (tempId: string) => void;
}

export function MessageList({ messages, onSelectFollowUp, failedMessageIds, onRetry }: Props) {
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
        <MessageItem
          key={m.id}
          message={m}
          isLatestAssistant={i === lastAssistantIndex}
          onSelectFollowUp={onSelectFollowUp}
          failedMessageIds={failedMessageIds}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}
