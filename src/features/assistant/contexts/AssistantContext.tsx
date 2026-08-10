"use client";

import { useTranslations } from "next-intl";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SharedProvider } from "../../../contexts";
import { useSocketContext } from "../../../contexts/SocketContext";
import { BreadcrumbItemData, JsonApiHydratedDataInterface, Modules, rehydrate, rehydrateList } from "../../../core";
import { usePageUrlGenerator } from "../../../hooks";
import { AssistantMessage } from "../../assistant-message/data/AssistantMessage";
import type { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import { AssistantMessageService } from "../../assistant-message/data/AssistantMessageService";
import type { AssistantInterface } from "../data/AssistantInterface";
import { AssistantService } from "../data/AssistantService";

interface AssistantContextValue {
  assistant?: AssistantInterface;
  messages: AssistantMessageInterface[];
  threads: AssistantInterface[];
  threadsLoading: boolean;
  sending: boolean;
  status?: string;
  failedMessageIds: Set<string>;
  sendMessage(
    content: string,
    opts?: { howToMode?: boolean; limitToHowToId?: string; contentBlocks?: unknown[] },
  ): Promise<void>;
  retrySend(tempId: string): Promise<void>;
  selectThread(id: string): Promise<void>;
  startNew(): void;
  renameThread(id: string, title: string): Promise<void>;
  deleteThread(id: string): Promise<void>;
  /** When true, create/append route to the operator-engine endpoints. */
  operatorMode: boolean;
  setOperatorMode(value: boolean): void;
  /** Appends a message returned outside the send flow (e.g. an approve/deny resume). */
  appendResolvedMessage(message: AssistantMessageInterface): void;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
  dehydratedAssistant?: JsonApiHydratedDataInterface;
  dehydratedMessages?: JsonApiHydratedDataInterface[];
  /**
   * When `true` (default), the provider mutates the browser URL on
   * create/selectThread/startNew (e.g. `/assistants/{id}`). Set to `false`
   * when the assistant is hosted inside a sheet / overlay so the user's
   * current route is preserved.
   */
  manageUrl?: boolean;
  /**
   * Confines the provider to one bound resource (e.g. a campaign): the thread
   * list is filtered to that resource and newly created threads are bound to
   * it, so a scoped surface never shows or creates cross-scope threads.
   */
  scope?: { type: string; id: string };
  /**
   * Builds the browser URL for a thread. Defaults to `/assistants/{id}` (or
   * `/assistants` when no thread is active), which is only correct for the
   * standalone assistant route; a scoped host passes its own builder.
   */
  threadUrl?: (id?: string) => string;
  /**
   * Page heading. Defaults to the "Assistants" entity label; a scoped host
   * passes something meaningful for its own surface.
   */
  titleOverride?: string;
  /**
   * Breadcrumb trail. Defaults to a single crumb pointing at the global
   * assistant list, which is wrong for a scoped surface.
   */
  breadcrumbsOverride?: BreadcrumbItemData[];
}

function stripOptimistic(list: AssistantMessageInterface[]): AssistantMessageInterface[] {
  return list.filter((m) => !m.isOptimistic);
}

function nextPosition(list: AssistantMessageInterface[]): number {
  return list.reduce((max, m) => (m.position > max ? m.position : max), 0) + 1;
}

function withPatchedTitle(source: AssistantInterface, title: string): AssistantInterface {
  const dehydrated = source.dehydrate();
  return rehydrate<AssistantInterface>(Modules.Assistant, {
    jsonApi: {
      ...dehydrated.jsonApi,
      attributes: { ...(dehydrated.jsonApi?.attributes ?? {}), title },
    },
    included: dehydrated.included,
  });
}

export function AssistantProvider({
  children,
  dehydratedAssistant,
  dehydratedMessages,
  manageUrl = true,
  titleOverride,
  breadcrumbsOverride,
  scope,
  threadUrl,
}: Props) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const resolveThreadUrl = useCallback(
    (id?: string) => (threadUrl ? threadUrl(id) : id ? `/assistants/${id}` : "/assistants"),
    [threadUrl],
  );

  const [assistant, setAssistant] = useState<AssistantInterface | undefined>(() =>
    dehydratedAssistant ? rehydrate<AssistantInterface>(Modules.Assistant, dehydratedAssistant) : undefined,
  );
  const [messages, setMessages] = useState<AssistantMessageInterface[]>(() =>
    dehydratedMessages ? rehydrateList<AssistantMessageInterface>(Modules.AssistantMessage, dehydratedMessages) : [],
  );
  const [threads, setThreads] = useState<AssistantInterface[]>([]);
  const [threadsLoading, setThreadsLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [failedMessageIds, setFailedMessageIds] = useState<Set<string>>(() => new Set());
  // The engine is persisted on the Assistant resource: an existing operator
  // thread must keep routing to the operator endpoints after a reload, so the
  // initial mode is derived from the hydrated thread instead of defaulting off.
  const [operatorMode, setOperatorMode] = useState<boolean>(
    () => dehydratedAssistant?.jsonApi?.attributes?.engine === "operator",
  );
  const { socket } = useSocketContext();

  const sendMessage = useCallback(
    async (content: string, opts?: { howToMode?: boolean; limitToHowToId?: string; contentBlocks?: unknown[] }) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const optimistic = AssistantMessage.buildOptimistic({
        content: trimmed,
        assistantId: assistant?.id,
        position: nextPosition(messages),
      });
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);

      const handler = (payload: { assistantId?: string; status?: string }) => {
        if (!payload) return;
        if (assistant && payload.assistantId && payload.assistantId !== assistant.id) return;
        if (typeof payload.status === "string") setStatus(payload.status);
      };
      socket?.on("assistant:status", handler);

      try {
        if (!assistant) {
          const input = {
            firstMessage: trimmed,
            howToMode: opts?.howToMode,
            limitToHowToId: opts?.limitToHowToId,
            contentBlocks: opts?.contentBlocks,
            boundContent: scope,
          };
          const created = operatorMode
            ? await AssistantService.createOperator(input)
            : await AssistantService.create(input);
          const msgs = await AssistantMessageService.findByAssistant({ assistantId: created.id });
          setAssistant(created);
          setMessages(msgs);
          setThreads((prev) => [created, ...prev]);
          if (manageUrl && typeof window !== "undefined") {
            window.history.replaceState(null, "", resolveThreadUrl(created.id));
          }
        } else {
          const result = operatorMode
            ? await AssistantService.appendMessageOperator({
                assistantId: assistant.id,
                content: trimmed,
                contentBlocks: opts?.contentBlocks,
              })
            : await AssistantService.appendMessage({
                assistantId: assistant.id,
                content: trimmed,
                howToMode: opts?.howToMode,
                limitToHowToId: opts?.limitToHowToId,
                contentBlocks: opts?.contentBlocks,
              });
          setMessages((prev) => [...stripOptimistic(prev), ...result]);
        }
      } catch {
        setFailedMessageIds((prev) => {
          const next = new Set(prev);
          next.add(optimistic.id);
          return next;
        });
      } finally {
        socket?.off("assistant:status", handler);
        setSending(false);
        setStatus(undefined);
      }
    },
    [assistant, messages, socket, operatorMode, scope, manageUrl, resolveThreadUrl],
  );

  const appendResolvedMessage = useCallback((message: AssistantMessageInterface) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  const retrySend = useCallback(
    async (tempId: string) => {
      const failed = messages.find((m) => m.id === tempId);
      if (!failed) return;
      const content = failed.content;

      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setFailedMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });

      await sendMessage(content);
    },
    [messages, sendMessage],
  );

  const selectThread = useCallback(
    async (id: string) => {
      const [target, msgs] = await Promise.all([
        AssistantService.findOne({ id }),
        AssistantMessageService.findByAssistant({ assistantId: id }),
      ]);
      setAssistant(target);
      setMessages(msgs);
      // Route follow-up sends by the thread's persisted engine: operator
      // threads stay on the operator endpoints, everything else (engine
      // absent) keeps the default responder flow.
      setOperatorMode(target.engine === "operator");
      if (manageUrl && typeof window !== "undefined") {
        window.history.replaceState(null, "", resolveThreadUrl(id));
      }
    },
    [manageUrl, resolveThreadUrl],
  );

  const renameThread = useCallback(async (id: string, title: string) => {
    await AssistantService.rename({ id, title });
    setAssistant((prev) => (prev && prev.id === id ? withPatchedTitle(prev, title) : prev));
    setThreads((prev) => prev.map((t) => (t.id === id ? withPatchedTitle(t, title) : t)));
  }, []);

  const startNew = useCallback(() => {
    setAssistant(undefined);
    setMessages([]);
    setFailedMessageIds(new Set());
    setOperatorMode(false);
    if (manageUrl && typeof window !== "undefined") {
      window.history.replaceState(null, "", resolveThreadUrl());
    }
  }, [manageUrl, resolveThreadUrl]);

  const deleteThread = useCallback(async (id: string) => {
    await AssistantService.delete({ id });
    setThreads((prev) => prev.filter((t) => t.id !== id));
    setAssistant((prev) => {
      if (prev?.id === id) {
        setMessages([]);
        return undefined;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setThreadsLoading(true);
      try {
        const loaded = await AssistantService.findMany({ boundType: scope?.type, boundId: scope?.id });
        if (!cancelled) setThreads(loaded);
      } finally {
        if (!cancelled) setThreadsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope?.type, scope?.id]);

  const value = useMemo<AssistantContextValue>(
    () => ({
      assistant,
      messages,
      threads,
      threadsLoading,
      sending,
      status,
      failedMessageIds,
      sendMessage,
      retrySend,
      selectThread,
      startNew,
      renameThread,
      deleteThread,
      operatorMode,
      setOperatorMode,
      appendResolvedMessage,
    }),
    [
      assistant,
      messages,
      threads,
      threadsLoading,
      sending,
      status,
      failedMessageIds,
      sendMessage,
      retrySend,
      selectThread,
      startNew,
      renameThread,
      deleteThread,
      operatorMode,
      appendResolvedMessage,
    ],
  );

  // A scoped assistant lives under its host resource, so the default trail to
  // the global /assistants list is wrong there — the consumer supplies its own.
  const breadcrumbs: BreadcrumbItemData[] = breadcrumbsOverride ?? [
    {
      name: t("entities.assistants", { count: 2 }),
      href: generateUrl({ page: Modules.Assistant }),
    },
  ];

  // `entities.tasks` was a copy-paste from another feature and rendered
  // "Tasks" as the page heading of every assistant page.
  const title = {
    type: titleOverride ?? t("entities.assistants", { count: 2 }),
  };

  return (
    <AssistantContext.Provider value={value}>
      <SharedProvider value={{ breadcrumbs, title }}>{children}</SharedProvider>
    </AssistantContext.Provider>
  );
}

export function useAssistantContext(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistantContext must be used within AssistantProvider");
  return ctx;
}
