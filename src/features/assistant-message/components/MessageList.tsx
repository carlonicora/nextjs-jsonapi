"use client";

import { AssistantMessageInterface } from "../data/AssistantMessageInterface";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: AssistantMessageInterface[];
}

export function MessageList({ messages }: MessageListProps) {
  const ordered = [...messages].sort((a, b) => a.position - b.position);
  return (
    <div className="flex flex-col gap-y-3">
      {ordered.map((m) => (
        <MessageItem key={m.id} message={m} />
      ))}
    </div>
  );
}
