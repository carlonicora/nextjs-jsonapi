"use client";

import { RoundPageContainer } from "../../../../components/containers/RoundPageContainer";
import { Modules } from "../../../../core";
import type { ApprovalActionRenderer } from "../../../assistant-message/components/MessageItem";
import { useAssistantContext } from "../../contexts/AssistantContext";
import { AssistantSidebar } from "../parts/AssistantSidebar";
import { AssistantEmptyState } from "../parts/AssistantEmptyState";
import { AssistantThreadHeader } from "../parts/AssistantThreadHeader";
import { AssistantThread } from "../parts/AssistantThread";
import { AssistantComposer } from "../parts/AssistantComposer";

interface Props {
  /**
   * Optional renderer for `approval-request` messages (operator engine). The
   * approval card component lives in the consuming app, which registers the
   * AssistantAction module; without this prop those messages fall back to the
   * plain markdown bubble.
   */
  renderApprovalAction?: ApprovalActionRenderer;
}

export function AssistantContainer({ renderApprovalAction }: Props = {}) {
  const ctx = useAssistantContext();
  const showThread = !!ctx.assistant || ctx.sending || ctx.messages.length > 0;

  return (
    <RoundPageContainer module={Modules.Assistant} fullWidth>
      <div className="bg-background flex h-full w-full overflow-hidden rounded-lg border">
        <AssistantSidebar
          threads={ctx.threads}
          activeId={ctx.assistant?.id}
          onSelect={ctx.selectThread}
          onNew={ctx.startNew}
        />
        <main className="flex flex-1 flex-col">
          {!showThread ? (
            <AssistantEmptyState
              onSend={ctx.sendMessage}
              operatorMode={ctx.operatorMode}
              onOperatorModeChange={ctx.setOperatorMode}
            />
          ) : (
            <>
              {ctx.assistant ? (
                <AssistantThreadHeader
                  assistant={ctx.assistant}
                  onRename={(title) => ctx.renameThread(ctx.assistant!.id, title)}
                  onDelete={() => ctx.deleteThread(ctx.assistant!.id)}
                />
              ) : (
                <div className="flex items-center justify-between border-b px-5 py-3" aria-hidden>
                  <div className="h-5" />
                </div>
              )}
              <AssistantThread
                messages={ctx.messages}
                sending={ctx.sending}
                status={ctx.status}
                onSelectFollowUp={ctx.sendMessage}
                failedMessageIds={ctx.failedMessageIds}
                onRetry={ctx.retrySend}
                renderApprovalAction={renderApprovalAction}
              />
              <AssistantComposer onSend={ctx.sendMessage} disabled={ctx.sending} />
            </>
          )}
        </main>
      </div>
    </RoundPageContainer>
  );
}
