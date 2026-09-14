"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { v4 } from "uuid";

import { Modules, rehydrate } from "../../../core";
import { usePageUrlGenerator } from "../../../hooks";
import { HandbookThreadMessage } from "../data/HandbookThreadMessage";
import type { HandbookThreadInterface } from "../data/HandbookThreadInterface";
import type { HandbookThreadMessageInterface } from "../data/HandbookThreadMessageInterface";
import { HandbookThreadMessageService } from "../data/HandbookThreadMessageService";
import { HandbookThreadService } from "../data/HandbookThreadService";

/**
 * The state of one handbook conversation, extracted verbatim from
 * `HandbookAskContainer`.
 *
 * Two surfaces now hold a conversation — the full `/chat` route and the side
 * sheet reachable from contents and reader — and they must behave identically:
 * same optimistic user message, same read-back through
 * `HandbookThreadService.findOne`, same error branch. Duplicating that in two
 * components is how the two drift, so it lives here and both consume it.
 *
 * The one difference is the address bar. The route keeps the url on the open
 * thread; opening a sheet is not a navigation, so the sheet passes
 * `syncUrl: false` and nothing is written to history.
 */

/**
 * Sources ride in the markdown rather than in a bespoke block: the message
 * renderer already renders markdown, and a list of file paths is exactly that.
 *
 * The message is rebuilt through `dehydrate()` + `rehydrate()` rather than a
 * fresh `buildLocal`, so it keeps its id and React does not remount the bubble
 * on every render. Mirrors `withPatchedTitle` in `AssistantContext`.
 */
function withSources(messages: HandbookThreadMessageInterface[], label: string): HandbookThreadMessageInterface[] {
  return messages.map((message) => withSourcesInContent(message, label));
}

function withSourcesInContent(message: HandbookThreadMessageInterface, label: string): HandbookThreadMessageInterface {
  if (message.role !== "assistant" || message.sources.length === 0) return message;

  const dehydrated = message.dehydrate();
  const content = `${message.content}\n\n**${label}**\n\n${message.sources.map((source) => `- \`${source}\``).join("\n")}`;

  return rehydrate<HandbookThreadMessageInterface>(Modules.HandbookThreadMessage, {
    jsonApi: {
      ...dehydrated.jsonApi,
      attributes: { ...(dehydrated.jsonApi?.attributes ?? {}), content },
    },
    included: dehydrated.included,
  });
}

export type UseHandbookAskParams = {
  /**
   * Keep the address bar on the open thread. Defaults to `true`, the route's
   * behaviour; the sheet passes `false`.
   */
  syncUrl?: boolean;
  /** Thread to open on mount, when the route carries one. */
  handbookThreadId?: string;
};

export type UseHandbookAskResult = {
  threads: HandbookThreadInterface[];
  thread: HandbookThreadInterface | undefined;
  messages: HandbookThreadMessageInterface[];
  sending: boolean;
  ask: (question: string, options?: { handbookPageId?: string }) => Promise<void>;
  selectThread: (id: string) => Promise<void>;
  startNew: () => void;
};

export function useHandbookAsk(params?: UseHandbookAskParams): UseHandbookAskResult {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const shouldSyncUrl = params?.syncUrl ?? true;
  const handbookThreadId = params?.handbookThreadId;

  const [threads, setThreads] = useState<HandbookThreadInterface[]>([]);
  const [thread, setThread] = useState<HandbookThreadInterface | undefined>(undefined);
  const [messages, setMessages] = useState<HandbookThreadMessageInterface[]>([]);
  const [sending, setSending] = useState(false);

  const sourcesLabel = t("handbook.chat.sources");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await HandbookThreadService.findMany();
      if (!cancelled) setThreads(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // A routed thread id opens that thread on mount, so the url survives a reload
  // or a pasted link. Runs once per id; selecting from the list takes the other
  // path and only replaces the url.
  useEffect(() => {
    if (!handbookThreadId) return;
    let cancelled = false;
    (async () => {
      const selected = await HandbookThreadService.findOne({ id: handbookThreadId });
      if (cancelled) return;
      setThread(selected);
      setMessages(withSources(selected.messages, sourcesLabel));
    })();
    return () => {
      cancelled = true;
    };
  }, [handbookThreadId]);

  /**
   * Keep the address bar on the open thread, the way ConversationListItem does
   * (`window.history.replaceState` with the generated url) — selecting a thread
   * is not a navigation, so this replaces rather than pushes.
   *
   * A no-op when the caller asked for no url sync: the sheet floats over a page
   * that is itself the navigation, and rewriting the url under it would send a
   * reader who closes the sheet somewhere they never went.
   */
  const syncUrl = useCallback(
    (id?: string) => {
      if (!shouldSyncUrl) return;
      const base = `${generateUrl({ page: Modules.HandbookPage })}/chat`;
      window.history.replaceState(null, "", id ? `${base}/${id}` : base);
    },
    [generateUrl, shouldSyncUrl],
  );

  const selectThread = useCallback(
    async (id: string) => {
      const selected = await HandbookThreadService.findOne({ id });
      setThread(selected);
      setMessages(withSources(selected.messages, sourcesLabel));
      syncUrl(id);
    },
    [syncUrl],
  );

  const startNew = useCallback(() => {
    setThread(undefined);
    setMessages([]);
    syncUrl(undefined);
  }, [syncUrl]);

  const ask = useCallback(
    async (question: string, options?: { handbookPageId?: string }) => {
      const trimmed = question.trim();
      if (!trimmed || sending) return;

      const position = messages.length;
      setMessages((current) => [
        ...current,
        HandbookThreadMessage.buildLocal({ role: "user", content: trimmed, position, isOptimistic: true }),
      ]);
      setSending(true);

      try {
        // Both branches end in the same read: only the single-thread endpoint
        // side-loads the messages, so the transcript always comes from there.
        let id = thread?.id;
        if (id === undefined) {
          const created = await HandbookThreadService.create({
            id: v4(),
            question: trimmed,
            handbookPageId: options?.handbookPageId,
          });
          id = created.id;
          setThreads((current) => [created, ...current]);
        } else {
          await HandbookThreadMessageService.ask({
            id: v4(),
            threadId: id,
            question: trimmed,
            handbookPageId: options?.handbookPageId,
          });
        }

        const loaded = await HandbookThreadService.findOne({ id });
        setThread(loaded);
        setMessages(withSources(loaded.messages, sourcesLabel));
        // The server derives the title from the first question, so the list row
        // created a moment ago has to pick it up.
        setThreads((current) => current.map((item) => (item.id === loaded.id ? loaded : item)));
        syncUrl(loaded.id);
      } catch {
        // 400 when the installation has no usable AI configuration, 403 for a
        // non-administrator. Neither is actionable from here, so both surface
        // as one assistant-side message rather than a bespoke error pane.
        setMessages((current) => [
          ...current,
          HandbookThreadMessage.buildLocal({
            role: "assistant",
            content: t("handbook.chat.failed"),
            position: position + 1,
          }),
        ]);
      } finally {
        setSending(false);
      }
    },
    [messages.length, sending, syncUrl, t, thread?.id],
  );

  return { threads, thread, messages, sending, ask, selectThread, startNew };
}
