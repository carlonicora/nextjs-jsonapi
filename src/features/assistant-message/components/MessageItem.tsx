"use client";

import { useTranslations } from "next-intl";
import { Sparkles, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AssistantMessageInterface } from "../data/AssistantMessageInterface";
import { MessageSourcesContainer } from "./parts/MessageSourcesContainer";

/**
 * Render slot for `approval-request` messages. The approval card lives in the
 * consuming app (it depends on the app-registered AssistantAction module), so
 * the chat renderer receives it as a function instead of importing it.
 */
export type ApprovalActionRenderer = (message: AssistantMessageInterface) => ReactNode;

interface Props {
  message: AssistantMessageInterface;
  isLatestAssistant: boolean;
  onSelectFollowUp: (q: string) => void;
  failedMessageIds?: Set<string>;
  onRetry?: (tempId: string) => void;
  renderApprovalAction?: ApprovalActionRenderer;
}

export function MessageItem({
  message,
  isLatestAssistant,
  onSelectFollowUp,
  failedMessageIds,
  onRetry,
  renderApprovalAction,
}: Props) {
  const t = useTranslations();
  const isUser = message.role === "user";
  const isFailed = isUser && !!failedMessageIds?.has(message.id);

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="bg-primary text-primary-foreground max-w-[72%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm">
          {message.content}
        </div>
        {isFailed && (
          <div className="text-destructive flex items-center gap-2 text-xs">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{t("features.assistant.send_failed")}</span>
            <button type="button" onClick={() => onRetry?.(message.id)}>
              {t("features.assistant.retry")}
            </button>
          </div>
        )}
      </div>
    );
  }

  const isApprovalRequest = message.messageType === "approval-request" && !!renderApprovalAction;

  return (
    <div className="flex min-w-0 max-w-[78%] flex-col gap-1.5">
      <div className="text-muted-foreground flex items-center gap-2 pl-1 text-xs">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
        <span>{t("features.assistant.agent_name")}</span>
      </div>
      {isApprovalRequest ? (
        renderApprovalAction(message)
      ) : (
        <div className="bg-muted text-foreground rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      )}
      <MessageSourcesContainer
        message={message}
        isLatestAssistant={isLatestAssistant}
        onSelectFollowUp={onSelectFollowUp}
      />
    </div>
  );
}
