"use client";

import type { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import { AssistantContainer } from "../../assistant/components/containers/AssistantContainer";
import { useAssistantContext } from "../../assistant/contexts/AssistantContext";
import { ApprovalActionCard } from "./ApprovalActionCard";

/**
 * AssistantContainer with the operator approval card wired in. The container
 * renders `approval-request` messages through the `renderApprovalAction` slot,
 * which stays a slot so the plain chat container has no dependency on the
 * AssistantAction module. Must be rendered inside an `AssistantProvider`.
 */
export function AssistantContainerWithApprovals() {
  const ctx = useAssistantContext();

  return (
    <AssistantContainer
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
