"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AssistantInterface } from "../data/AssistantInterface";
import type { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import { AssistantService } from "../data/AssistantService";
import { AssistantMessageService } from "../../assistant-message/data/AssistantMessageService";
import { useSocketContext } from "../../../contexts/SocketContext";

interface AssistantContextValue {
  assistant?: AssistantInterface;
  messages: AssistantMessageInterface[];
  threads: AssistantInterface[];
  threadsLoading: boolean;
  sending: boolean;
  status?: string;
  sendMessage(content: string): Promise<void>;
  selectThread(id: string): Promise<void>;
  startNew(): void;
  renameThread(id: string, title: string): Promise<void>;
  deleteThread(id: string): Promise<void>;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

interface Props {
  children: React.ReactNode;
  dehydratedAssistant?: AssistantInterface;
  dehydratedMessages?: AssistantMessageInterface[];
}

export function AssistantProvider({ children, dehydratedAssistant, dehydratedMessages }: Props) {
  const [assistant, setAssistant] = useState<AssistantInterface | undefined>(dehydratedAssistant);
  const [messages, setMessages] = useState<AssistantMessageInterface[]>(dehydratedMessages ?? []);
  const [threads, setThreads] = useState<AssistantInterface[]>([]);
  const [threadsLoading, setThreadsLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { socket } = useSocketContext();

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
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
          const [userMsg, assistantMsg] = result;
          setMessages((prev) => [...prev, userMsg, assistantMsg]);
        }
      } finally {
        socket?.off("assistant:status", handler);
        setSending(false);
        setStatus(undefined);
      }
    },
    [assistant, socket],
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
    setAssistant((prev) =>
      prev && prev.id === id
        ? (Object.assign(Object.create(Object.getPrototypeOf(prev)), prev, { _title: title, title }) as typeof prev)
        : prev,
    );
    setThreads((prev) =>
      prev.map((t) =>
        t.id === id
          ? (Object.assign(Object.create(Object.getPrototypeOf(t)), t, { _title: title, title }) as typeof t)
          : t,
      ),
    );
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
      sendMessage,
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
      sendMessage,
      selectThread,
      renameThread,
      deleteThread,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistantContext(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistantContext must be used within AssistantProvider");
  return ctx;
}
