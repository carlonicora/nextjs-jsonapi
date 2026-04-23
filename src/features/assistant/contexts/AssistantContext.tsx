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
  sendMessage(content: string): Promise<void>;
  retrySend(tempId: string): Promise<void>;
  selectThread(id: string): Promise<void>;
  startNew(): void;
  renameThread(id: string, title: string): Promise<void>;
  deleteThread(id: string): Promise<void>;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
  dehydratedAssistant?: JsonApiHydratedDataInterface;
  dehydratedMessages?: JsonApiHydratedDataInterface[];
}

function stripOptimistic(list: AssistantMessageInterface[]): AssistantMessageInterface[] {
  return list.filter((m) => !m.id.startsWith("tmp-"));
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

export function AssistantProvider({ children, dehydratedAssistant, dehydratedMessages }: Props) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

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
  const { socket } = useSocketContext();

  const sendMessage = useCallback(
    async (content: string) => {
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
          const created = await AssistantService.create({ firstMessage: trimmed });
          const msgs = await AssistantMessageService.findByAssistant({ assistantId: created.id });
          setAssistant(created);
          setMessages(msgs);
          setThreads((prev) => [created, ...prev]);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/assistants/${created.id}`);
          }
        } else {
          const result = await AssistantService.appendMessage({
            assistantId: assistant.id,
            content: trimmed,
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
    [assistant, messages, socket],
  );

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

  const selectThread = useCallback(async (id: string) => {
    const [target, msgs] = await Promise.all([
      AssistantService.findOne({ id }),
      AssistantMessageService.findByAssistant({ assistantId: id }),
    ]);
    setAssistant(target);
    setMessages(msgs);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/assistants/${id}`);
    }
  }, []);

  const renameThread = useCallback(async (id: string, title: string) => {
    await AssistantService.rename({ id, title });
    setAssistant((prev) => (prev && prev.id === id ? withPatchedTitle(prev, title) : prev));
    setThreads((prev) => prev.map((t) => (t.id === id ? withPatchedTitle(t, title) : t)));
  }, []);

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
        const loaded = await AssistantService.findMany();
        if (!cancelled) setThreads(loaded);
      } finally {
        if (!cancelled) setThreadsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      startNew: () => setAssistant(undefined),
      renameThread,
      deleteThread,
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
      renameThread,
      deleteThread,
    ],
  );

  const breadcrumbs: BreadcrumbItemData[] = [
    {
      name: t("entities.assistants", { count: 2 }),
      href: generateUrl({ page: Modules.Assistant }),
    },
  ];

  const title = {
    type: t("entities.tasks", { count: 2 }),
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
