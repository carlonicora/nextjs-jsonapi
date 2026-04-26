"use client";

import { useEffect, useRef } from "react";
import type { AssistantMessageInterface } from "../../../assistant-message/data/AssistantMessageInterface";
import { MessageList } from "../../../assistant-message/components/MessageList";
import { AssistantStatusLine } from "./AssistantStatusLine";

interface Props {
  messages: AssistantMessageInterface[];
  sending: boolean;
  status?: string;
  onSelectFollowUp: (q: string) => void;
  failedMessageIds?: Set<string>;
  onRetry?: (tempId: string) => void;
}

export function AssistantThread({ messages, sending, status, onSelectFollowUp, failedMessageIds, onRetry }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  return (
    <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-6 py-5">
      <MessageList
        messages={messages}
        onSelectFollowUp={onSelectFollowUp}
        failedMessageIds={failedMessageIds}
        onRetry={onRetry}
      />
      {sending && <AssistantStatusLine status={status} />}
      <div ref={endRef} />
    </div>
  );
}
