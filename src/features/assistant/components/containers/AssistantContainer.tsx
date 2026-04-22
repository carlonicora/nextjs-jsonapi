"use client";

import { RoundPageContainer } from "../../../../components/containers/RoundPageContainer";
import { Modules } from "../../../../core";
import { useAssistantContext } from "../../contexts/AssistantContext";
import { AssistantSidebar } from "../parts/AssistantSidebar";
import { AssistantEmptyState } from "../parts/AssistantEmptyState";
import { AssistantThreadHeader } from "../parts/AssistantThreadHeader";
import { AssistantThread } from "../parts/AssistantThread";
import { AssistantComposer } from "../parts/AssistantComposer";

export function AssistantContainer() {
  const ctx = useAssistantContext();

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
          {!ctx.assistant ? (
            <AssistantEmptyState onSend={ctx.sendMessage} />
          ) : (
            <>
              <AssistantThreadHeader
                assistant={ctx.assistant}
                onRename={(title) => ctx.renameThread(ctx.assistant!.id, title)}
                onDelete={() => ctx.deleteThread(ctx.assistant!.id)}
              />
              <AssistantThread
                messages={ctx.messages}
                sending={ctx.sending}
                status={ctx.status}
                onSelectFollowUp={ctx.sendMessage}
              />
              <AssistantComposer onSend={ctx.sendMessage} disabled={ctx.sending} />
            </>
          )}
        </main>
      </div>
    </RoundPageContainer>
  );
}
