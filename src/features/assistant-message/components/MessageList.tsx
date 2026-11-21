"use client";

import type { ReactNode, RefObject } from "react";
import { AssistantMessageInterface } from "../data/AssistantMessageInterface";
import { MessageItem, type ApprovalActionRenderer, type MentionRenderer } from "./MessageItem";

/**
 * Host slot rendered right after one message, inside its wrapper. Receives the
 * message and its neighbours in display order.
 */
export type AfterMessageRenderer = (
  message: AssistantMessageInterface,
  neighbours: { previous?: AssistantMessageInterface; next?: AssistantMessageInterface },
) => ReactNode;

/**
 * Host slot rendered BESIDE one message, same arguments as `AfterMessageRenderer`.
 * When given, each message row becomes a two-column grid from `lg` up (message
 * left, this content right, top-aligned); below `lg` the content stacks under
 * the message. A row whose renderer returns nothing keeps the right half empty.
 */
export type BesideMessageRenderer = AfterMessageRenderer;

interface Props {
  messages: AssistantMessageInterface[];
  onSelectFollowUp?: (q: string) => void;
  failedMessageIds?: Set<string>;
  onRetry?: (tempId: string) => void;
  renderApprovalAction?: ApprovalActionRenderer;
  renderMention?: MentionRenderer;
  lastMessageRef?: RefObject<HTMLDivElement | null>;
  renderAfterMessage?: AfterMessageRenderer;
  /** Opt-in two-column rows (see `BesideMessageRenderer`). Omitted, rows render as before. */
  renderBesideMessage?: BesideMessageRenderer;
  /** Hides the sources panel and the suggested questions under each reply. */
  hideSources?: boolean;
}

export function MessageList({
  messages,
  onSelectFollowUp,
  failedMessageIds,
  onRetry,
  renderApprovalAction,
  renderMention,
  lastMessageRef,
  renderAfterMessage,
  renderBesideMessage,
  hideSources = false,
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
      {ordered.map((m, i) => {
        const neighbours = { previous: ordered[i - 1], next: ordered[i + 1] };
        const ref = i === ordered.length - 1 ? lastMessageRef : undefined;
        const item = (
          <MessageItem
            message={m}
            isLatestAssistant={i === lastAssistantIndex}
            onSelectFollowUp={onSelectFollowUp}
            failedMessageIds={failedMessageIds}
            onRetry={onRetry}
            renderApprovalAction={renderApprovalAction}
            renderMention={renderMention}
            hideSources={hideSources}
            fillColumn={!!renderBesideMessage}
          />
        );
        if (!renderBesideMessage)
          return (
            <div key={m.id} ref={ref} className="flex min-w-0 flex-col">
              {item}
              {renderAfterMessage?.(m, neighbours)}
            </div>
          );
        const beside = renderBesideMessage(m, neighbours);
        return (
          <div
            key={m.id}
            ref={ref}
            className="grid min-w-0 grid-cols-1 items-start gap-x-6 gap-y-3 lg:grid-cols-2"
            data-message-row={m.id}
          >
            <div className="flex min-w-0 flex-col lg:col-start-1">
              {item}
              {renderAfterMessage?.(m, neighbours)}
            </div>
            {beside !== null && beside !== undefined && beside !== false ? (
              <div className="min-w-0 lg:col-start-2" data-message-beside={m.id}>
                {beside}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
