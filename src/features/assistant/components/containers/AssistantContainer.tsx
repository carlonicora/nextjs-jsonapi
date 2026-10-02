"use client";

import { MessagesSquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";
import { RoundPageContainer } from "../../../../components/containers/RoundPageContainer";
import { Modules } from "../../../../core";
import { EntityMentionLink } from "../../../assistant-message/components/EntityMentionLink";
import type { ApprovalActionRenderer, MentionRenderer } from "../../../assistant-message/components/MessageItem";
import type { AssistantInterface } from "../../data/AssistantInterface";
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
  /**
   * Renderer for `mention://<type>/<id>` links in assistant answers. Defaults
   * to `EntityMentionLink`, which links registered modules to their page.
   */
  renderMention?: MentionRenderer;
  /** When true the container renders without the `RoundPageContainer` page chrome (e.g. inside a sheet). */
  embedded?: boolean;
  /** Rendered inside the composer (bottom-left), before the first message of a new thread. */
  renderScopePicker?: () => ReactNode;
  /** Rendered after each thread title in the sidebar. */
  renderThreadBadge?: (thread: AssistantInterface) => ReactNode;
  /** When false, the empty state hides the operator-mode toggle and threads use the default engine. Defaults to true. */
  showOperatorToggle?: boolean;
}

export function AssistantContainer({
  renderApprovalAction,
  renderMention,
  embedded,
  renderScopePicker,
  renderThreadBadge,
  showOperatorToggle = true,
}: Props = {}) {
  const t = useTranslations();
  const ctx = useAssistantContext();
  const showThread = !!ctx.assistant || ctx.sending || ctx.messages.length > 0;

  // Memoised: a fresh element on every render fed into RoundPageContainer is
  // the shape that produces React's "Maximum update depth exceeded".
  const details = useMemo(
    () => (
      // The panel supplies its own padding and border; cancel both so the list
      // reads as the panel body rather than a card inside it.
      <div className="-m-4 flex h-full min-h-0 [&>aside]:w-full [&>aside]:border-e-0 [&>aside]:bg-transparent">
        <AssistantSidebar
          threads={ctx.threads}
          activeId={ctx.assistant?.id}
          onSelect={ctx.selectThread}
          renderThreadBadge={renderThreadBadge}
        />
      </div>
    ),
    [ctx.threads, ctx.assistant?.id, ctx.selectThread, renderThreadBadge],
  );

  const thread = (
    <>
      {!showThread ? (
        <AssistantEmptyState
          onSend={ctx.sendMessage}
          operatorMode={ctx.operatorMode}
          onOperatorModeChange={showOperatorToggle ? ctx.setOperatorMode : undefined}
          composerLeading={renderScopePicker?.()}
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
            renderMention={renderMention ?? EntityMentionLink}
          />
          <AssistantComposer onSend={ctx.sendMessage} disabled={ctx.sending} />
        </>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="bg-background flex h-full w-full overflow-hidden rounded-lg border">
        <AssistantSidebar
          threads={ctx.threads}
          activeId={ctx.assistant?.id}
          onSelect={ctx.selectThread}
          onNew={ctx.startNew}
          renderThreadBadge={renderThreadBadge}
        />
        <main className="flex flex-1 flex-col">{thread}</main>
      </div>
    );
  }

  // The page mirrors the conversations page: the thread list lives in the
  // page's details panel, the new-thread action in the page header (set by
  // AssistantProvider), and the conversation fills the card.
  return (
    <RoundPageContainer
      module={Modules.Assistant}
      id={ctx.assistant?.id}
      fullWidth
      forceHeader
      defaultDetailsOpen
      detailsTitle={t("features.assistant.list_title")}
      detailsIcon={<MessagesSquareIcon />}
      details={details}
    >
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">{thread}</div>
    </RoundPageContainer>
  );
}
