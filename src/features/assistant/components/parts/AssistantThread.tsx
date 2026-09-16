"use client";

import { useEffect, useRef } from "react";
import type { AssistantMessageInterface } from "../../../assistant-message/data/AssistantMessageInterface";
import { MessageList } from "../../../assistant-message/components/MessageList";
import type { ApprovalActionRenderer, MentionRenderer } from "../../../assistant-message/components/MessageItem";
import { AssistantStatusLine } from "./AssistantStatusLine";

interface Props {
  messages: AssistantMessageInterface[];
  sending: boolean;
  status?: string;
  onSelectFollowUp: (q: string) => void;
  failedMessageIds?: Set<string>;
  onRetry?: (tempId: string) => void;
  renderApprovalAction?: ApprovalActionRenderer;
  renderMention?: MentionRenderer;
}

export function AssistantThread({
  messages,
  sending,
  status,
  onSelectFollowUp,
  failedMessageIds,
  onRetry,
  renderApprovalAction,
  renderMention,
}: Props) {
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // `block: "start"` on purpose: the reader should land on the FIRST line of the
  // newest message, not at the end of the thread. Scrolling to the bottom would
  // drop them at the last line of a long answer and force them to scroll back up.
  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [messages.length, sending]);

  return (
    <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-6 py-5">
      <MessageList
        messages={messages}
        onSelectFollowUp={onSelectFollowUp}
        failedMessageIds={failedMessageIds}
        onRetry={onRetry}
        renderApprovalAction={renderApprovalAction}
        renderMention={renderMention}
        lastMessageRef={lastMessageRef}
      />
      {sending && <AssistantStatusLine status={status} />}
    </div>
  );
}
