"use client";

import { MessagesSquareIcon, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { RoundPageContainer } from "../../../../components/containers/RoundPageContainer";
import { SectionHeader } from "../../../../components/typography";
import { Modules } from "../../../../core";
import { AssistantComposer } from "../../../assistant/components/parts/AssistantComposer";
import { AssistantSidebar } from "../../../assistant/components/parts/AssistantSidebar";
import { AssistantThread } from "../../../assistant/components/parts/AssistantThread";
import { HandbookProvider } from "../../contexts/HandbookContext";
import { useHandbookAsk } from "../../hooks/useHandbookAsk";

/**
 * The handbook ask surface.
 *
 * Composition is copied from `AssistantPageContainer` — the full-page assistant
 * — top to bottom: the thread list lives in the page's details panel (which
 * renders it on the trailing side) and the conversation fills the card. The
 * transcript is rendered by the SAME components as every other chat in the
 * product (`AssistantSidebar`, `AssistantThread`),
 * which take their data as plain props and are typed against the structural
 * `AssistantInterface` / `AssistantMessageInterface` that `HandbookThread` and
 * `HandbookThreadMessage` implement.
 *
 * Two deliberate deviations from that reference, both forced by the data source:
 *
 * 1. It cannot MOUNT `AssistantPageContainer`, which reads
 *    `useAssistantContext()`. That provider is bound to the `Assistant` entity,
 *    which is company scoped, and a platform administrator has no company — so
 *    the handbook owns its own threads, and the state that provider would hold
 *    lives in `useHandbookAsk` — shared with the ask sheet, which is the same
 *    conversation on a different surface.
 * 2. The composer is the plain `AssistantComposer`, not the BlockNote one. The
 *    BlockNote composer exists so a first message can carry `@`-mentions of
 *    product entities; the handbook agent answers from documentation pages and
 *    has no entities to mention, so that machinery would be dead weight.
 *
 * Every label is passed in from the `handbook.*` namespace. The assistant's own
 * copy ("New assistant", "no assistants yet", "ask me about a matter, a client,
 * a document…") is wrong on this surface, so the shared parts take optional
 * label props that default to their existing text.
 */

type HandbookAskContainerProps = {
  /** Thread to open on mount, when the route carries one. */
  handbookThreadId?: string;
};

export function HandbookAskContainer({ handbookThreadId }: HandbookAskContainerProps = {}) {
  const t = useTranslations();

  // The conversation itself lives in `useHandbookAsk`, because the ask sheet
  // holds the same one. The route keeps the default `syncUrl: true`, so the
  // address bar still follows the open thread exactly as it did when this
  // component owned the state.
  const { threads, thread, messages, sending, ask, selectThread, startNew } = useHandbookAsk({ handbookThreadId });

  const showThread = !!thread || sending || messages.length > 0;
  // Memoised, and not as a micro-optimisation: it was a fresh object on every
  // render being fed into RoundPageContainer, which is the shape that produces
  // React's "Maximum update depth exceeded".
  const details = useMemo(
    () => (
      // The panel supplies its own padding and border; cancel both so the list
      // reads as the panel body rather than a card inside it.
      <div className="-m-4 flex h-full min-h-0 [&>aside]:w-full [&>aside]:border-e-0 [&>aside]:bg-transparent">
        <AssistantSidebar
          threads={threads}
          activeId={thread?.id}
          onSelect={selectThread}
          onNew={startNew}
          newLabel={t("handbook.chat.new")}
          emptyLabel={t("handbook.chat.empty_sidebar")}
        />
      </div>
    ),
    [selectThread, startNew, t, thread?.id, threads],
  );

  return (
    // `RoundPageContainer` reads the page heading from the shared context, and
    // `forceHeader` is what renders it — without a provider the hook throws.
    // `HandbookProvider` is that provider for every handbook surface; the ask
    // is the one that overrides the title, because it is a conversation about
    // the manual rather than a page of it.
    <HandbookProvider titleType={t("handbook.chat.title")}>
      <RoundPageContainer
        module={Modules.HandbookPage}
        id={thread?.id}
        fullWidth
        forceHeader
        defaultDetailsOpen
        detailsTitle={t("handbook.chat.list_title")}
        detailsIcon={<MessagesSquareIcon />}
        details={details}
      >
        {/* No `rounded-lg border` here. `AssistantPageContainer` has them on
            this wrapper, but RoundPageContainer already draws the card's border
            around this child, so copying them doubles it. a360's own chat
            content — ConversationMessageContainer — is a bare
            `flex h-full w-full min-h-0 flex-col`, and that is the shape this
            app's pages are built to. */}
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
          {showThread ? (
            <>
              {/* No per-thread header. `RoundPageContainer` already renders the
                  page header above this card, and a second title row inside it
                  is the double header. `AssistantThreadHeader` also carries
                  rename/delete, which this surface does not offer —
                  `ConversationMessageContainer` has no such row either. */}
              <AssistantThread
                messages={messages}
                sending={sending}
                status={t("handbook.chat.pending")}
                onSelectFollowUp={ask}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10">
              <div className="flex max-w-2xl flex-col items-center text-center">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <SectionHeader>{t("handbook.chat.empty_state.title")}</SectionHeader>
                <p className="text-muted-foreground mt-1 text-sm">{t("handbook.chat.empty_state.subtitle")}</p>
              </div>
            </div>
          )}
          <AssistantComposer
            onSend={ask}
            disabled={sending}
            placeholder={t("handbook.chat.placeholder")}
            sendLabel={t("handbook.chat.ask")}
          />
        </div>
      </RoundPageContainer>
    </HandbookProvider>
  );
}
