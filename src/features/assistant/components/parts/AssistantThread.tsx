"use client";

import { useEffect, useRef } from "react";
import type { AssistantMessageInterface } from "../../../assistant-message/data/AssistantMessageInterface";
import type { RenderMessageSources } from "../../../assistant-message/components/MessageItem";
import { MessageList } from "../../../assistant-message/components/MessageList";
import { AssistantStatusLine } from "./AssistantStatusLine";

interface Props {
  messages: AssistantMessageInterface[];
  sending: boolean;
  status?: string;
  onSelectFollowUp: (q: string) => void;
  failedMessageIds?: Set<string>;
  onRetry?: (tempId: string) => void;
  renderMessageSources?: RenderMessageSources;
}

export function AssistantThread({
  messages,
  sending,
  status,
  onSelectFollowUp,
  failedMessageIds,
  onRetry,
  renderMessageSources,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <MessageList
        messages={messages}
        onSelectFollowUp={onSelectFollowUp}
        failedMessageIds={failedMessageIds}
        onRetry={onRetry}
        renderMessageSources={renderMessageSources}
      />
      {sending && <AssistantStatusLine status={status} />}
      <div ref={endRef} />
    </div>
  );
}
