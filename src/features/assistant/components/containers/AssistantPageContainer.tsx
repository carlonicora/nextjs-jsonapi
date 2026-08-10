"use client";

import type { DefaultReactSuggestionItem, SuggestionMenuProps } from "@blocknote/react";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { RoundPageContainer } from "../../../../components/containers/RoundPageContainer";
import type { MentionResolveFn } from "../../../../components/editors/BlockNoteEditorMentionInlineContent";
import type { MentionItem } from "../../../../components/editors/BlockNoteEditorSuggestionMenuController";
import { SectionHeader } from "../../../../components/typography";
import { Modules } from "../../../../core";
import type { ApprovalActionRenderer, MentionRenderer } from "../../../assistant-message/components/MessageItem";
import { useAssistantContext } from "../../contexts/AssistantContext";
import { AssistantBlockNoteComposer } from "../parts/AssistantBlockNoteComposer";
import { AssistantSidebar } from "../parts/AssistantSidebar";
import { AssistantThread } from "../parts/AssistantThread";
import { AssistantThreadHeader } from "../parts/AssistantThreadHeader";

interface Props {
  renderApprovalAction?: ApprovalActionRenderer;
  renderMention?: MentionRenderer;
  mentionSearchFn?: (query: string, params?: Record<string, string>) => Promise<MentionItem[]>;
  mentionSearchParams?: Record<string, string>;
  mentionResolveFn?: MentionResolveFn;
  /**
   * Custom mention menu for the composer. Without one BlockNote renders its
   * default menu, which keys rows on the item title — duplicate entity names
   * then collide.
   */
  suggestionMenuComponent?: React.FC<SuggestionMenuProps<DefaultReactSuggestionItem>>;
  /** Rendered inside the sidebar's details panel above the thread list. */
  detailsTitle: string;
  detailsIcon: React.ReactNode;
}

/**
 * Full-page assistant: the thread list lives in the page's details panel and
 * the conversation fills the card. Unlike `AssistantContainer` the composer is
 * the BlockNote one, so the very first message of a thread can carry mentions.
 */
export function AssistantPageContainer({
  renderApprovalAction,
  renderMention,
  mentionSearchFn,
  mentionSearchParams,
  mentionResolveFn,
  suggestionMenuComponent,
  detailsTitle,
  detailsIcon,
}: Props) {
  const t = useTranslations();
  const ctx = useAssistantContext();
  const showThread = !!ctx.assistant || ctx.sending || ctx.messages.length > 0;

  return (
    <RoundPageContainer
      module={Modules.Assistant}
      fullWidth
      forceHeader
      defaultDetailsOpen
      detailsTitle={detailsTitle}
      detailsIcon={detailsIcon}
      details={
        // The panel supplies its own padding and border; cancel both so the
        // sidebar reads as the panel body rather than a card inside it.
        <div className="-m-4 flex h-full min-h-0 [&>aside]:w-full [&>aside]:border-r-0 [&>aside]:bg-transparent">
          <AssistantSidebar
            threads={ctx.threads}
            activeId={ctx.assistant?.id}
            onSelect={ctx.selectThread}
            onNew={ctx.startNew}
          />
        </div>
      }
    >
      <div className="bg-background flex h-full w-full flex-col overflow-hidden rounded-lg border">
        {showThread ? (
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
              renderMention={renderMention}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-10">
            <div className="flex max-w-2xl flex-col items-center text-center">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <SectionHeader>{t("features.assistant.empty_state.title")}</SectionHeader>
              <p className="text-muted-foreground mt-1 text-sm">{t("features.assistant.empty_state.subtitle")}</p>
            </div>
          </div>
        )}
        <AssistantBlockNoteComposer
          onSend={(content, opts) => ctx.sendMessage(content, { contentBlocks: opts.contentBlocks })}
          disabled={ctx.sending}
          mentionSearchFn={mentionSearchFn}
          mentionSearchParams={mentionSearchParams}
          mentionResolveFn={mentionResolveFn}
          suggestionMenuComponent={suggestionMenuComponent}
        />
      </div>
    </RoundPageContainer>
  );
}
