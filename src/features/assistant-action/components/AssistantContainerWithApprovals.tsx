"use client";

import type { ReactNode } from "react";
import type { MentionRenderer } from "../../assistant-message/components/MessageItem";
import type { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import { AssistantContainer } from "../../assistant/components/containers/AssistantContainer";
import type { AssistantInterface } from "../../assistant/data/AssistantInterface";
import { useAssistantContext } from "../../assistant/contexts/AssistantContext";
import { ApprovalActionCard } from "./ApprovalActionCard";

interface Props {
  renderMention?: MentionRenderer;
  embedded?: boolean;
  renderScopePicker?: () => ReactNode;
  renderThreadBadge?: (thread: AssistantInterface) => ReactNode;
  showOperatorToggle?: boolean;
}

/**
 * AssistantContainer with the operator approval card wired in. The container
 * renders `approval-request` messages through the `renderApprovalAction` slot,
 * which stays a slot so the plain chat container has no dependency on the
 * AssistantAction module. Must be rendered inside an `AssistantProvider`.
 */
export function AssistantContainerWithApprovals({
  renderMention,
  embedded,
  renderScopePicker,
  renderThreadBadge,
  showOperatorToggle,
}: Props = {}) {
  const ctx = useAssistantContext();

  return (
    <AssistantContainer
      renderMention={renderMention}
      embedded={embedded}
      renderScopePicker={renderScopePicker}
      renderThreadBadge={renderThreadBadge}
      showOperatorToggle={showOperatorToggle}
      renderApprovalAction={(message: AssistantMessageInterface) =>
        message.actionId ? (
          <ApprovalActionCard
            actionId={message.actionId}
            summary={message.content}
            onResolved={ctx.appendResolvedMessage}
          />
        ) : (
          <div className="bg-muted text-foreground rounded-2xl rounded-es-sm px-3.5 py-2.5 text-sm leading-relaxed">
            {message.content}
          </div>
        )
      }
    />
  );
}
