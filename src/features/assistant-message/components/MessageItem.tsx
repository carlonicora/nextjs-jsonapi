"use client";

import { AssistantMessageInterface } from "../data/AssistantMessageInterface";

interface MessageItemProps {
  message: AssistantMessageInterface;
}

export function MessageItem({ message }: MessageItemProps) {
  const isAssistant = message.role === "assistant";
  const alignment = isAssistant ? "items-start" : "items-end";
  const bubbleClass = isAssistant ? "bg-muted text-foreground" : "bg-primary text-primary-foreground";

  return (
    <div className={`flex w-full flex-col gap-y-1 ${alignment}`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${bubbleClass}`}>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>
      {isAssistant && message.references.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {message.references.map((ref, idx) => (
            <span
              key={`${ref.type}-${ref.id}-${idx}`}
              className="text-muted-foreground bg-muted rounded-full border px-2 py-0.5 text-xs"
              title={ref.reason}
            >
              {ref.type}: {ref.id.slice(0, 8)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
