"use client";

import { PlusCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SharedProvider } from "../../../contexts";
import { Button } from "../../../shadcnui";
import { useSocketContext } from "../../../contexts/SocketContext";
import { BreadcrumbItemData, JsonApiHydratedDataInterface, Modules, rehydrate, rehydrateList } from "../../../core";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { usePageUrlGenerator } from "../../../hooks";
import { AssistantMessage } from "../../assistant-message/data/AssistantMessage";
import type { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import { AssistantMessageService } from "../../assistant-message/data/AssistantMessageService";
import type { AssistantInterface } from "../data/AssistantInterface";
import { AssistantService } from "../data/AssistantService";
import type { SkillInterface } from "../../skill/data/SkillInterface";
import { SkillService } from "../../skill/data/SkillService";

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
    opts?: {
      howToMode?: boolean;
      limitToHowToId?: string;
      handbookMode?: boolean;
      limitToHandbookPageId?: string;
      contentBlocks?: unknown[];
    },
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
  /** The scope a NEW thread will bind to. Starts from the provider's `scope` prop. */
  scope?: { type: string; id: string };
  /** Changes the scope a new thread binds to. Ignored once a thread is active. */
  setScope(scope?: { type: string; id: string }): void;
  /**
   * Active skills of the company, for the `/` menu. Loaded only while operator
   * mode is on and the app registered the Skill module; `[]` otherwise.
   */
  skills: SkillInterface[];
  /** Reloads `skills` and resolves the fresh list (`[]` when skills do not apply or the read fails). */
  refreshSkills(): Promise<SkillInterface[]>;
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
   * Confines every turn of this provider to one retrieval mode. The handbook
   * surface sets `{ handbookMode: true }` so the flag does not have to be
   * threaded through the composer on each send — the same reason `scope`
   * exists on this provider.
   */
  retrievalMode?: { handbookMode?: boolean; limitToHandbookPageId?: string };
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
  /**
   * Sent as `clientContext` with every user message of this provider (create
   * and append, both engines). Opaque to the library: it never reads the
   * keys or values, the host's server does.
   */
  clientContext?: Record<string, string>;
  /**
   * Title of a thread this provider creates. Absent, the server names the
   * thread itself. Opaque to the library.
   */
  newThreadTitle?: string;
  /**
   * Operator mode of a new conversation (no hydrated thread, and after
   * `startNew`). Defaults to `false`. A hydrated thread always follows its
   * persisted engine.
   */
  defaultOperatorMode?: boolean;
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
  retrievalMode,
  threadUrl,
  clientContext,
  newThreadTitle,
  defaultOperatorMode = false,
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
  const [operatorMode, setOperatorMode] = useState<boolean>(() =>
    dehydratedAssistant ? dehydratedAssistant.jsonApi?.attributes?.engine === "operator" : defaultOperatorMode,
  );
  const [skills, setSkills] = useState<SkillInterface[]>([]);
  // Read after an await, so a list that arrives once operator mode is off is dropped.
  const operatorModeRef = useRef(operatorMode);
  useEffect(() => {
    operatorModeRef.current = operatorMode;
  }, [operatorMode]);
  // The scope the next created thread binds to. Starts from the `scope` prop
  // and can be changed by the host (e.g. a scope picker) until a thread exists.
  const [pendingScope, setPendingScope] = useState<{ type: string; id: string } | undefined>(scope);
  const { socket } = useSocketContext();

  const sendMessage = useCallback(
    async (
      content: string,
      opts?: {
        howToMode?: boolean;
        limitToHowToId?: string;
        handbookMode?: boolean;
        limitToHandbookPageId?: string;
        contentBlocks?: unknown[];
      },
    ) => {
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

      // A new thread is named and persisted before its answer runs; the server
      // announces it on `assistant:created` so the thread list and the URL
      // update immediately instead of when the long create request returns.
      let createdHandled = false;
      const createdHandler = (payload: {
        assistant?: { data?: JsonApiHydratedDataInterface["jsonApi"]; included?: any[] };
      }) => {
        if (createdHandled) return;
        const data = payload?.assistant?.data;
        if (!data || typeof data !== "object" || typeof data.id !== "string" || !data.id) return;
        let thread: AssistantInterface;
        try {
          thread = rehydrate<AssistantInterface>(Modules.Assistant, {
            jsonApi: data,
            included: payload.assistant?.included ?? [],
          });
        } catch {
          return;
        }
        if (!thread?.id) return;
        createdHandled = true;
        setAssistant(thread);
        setThreads((prev) => [thread, ...prev.filter((row) => row.id !== thread.id)]);
        if (manageUrl && typeof window !== "undefined") {
          window.history.replaceState(null, "", resolveThreadUrl(thread.id));
        }
      };
      if (!assistant) socket?.on("assistant:created", createdHandler);

      try {
        if (!assistant) {
          const input = {
            firstMessage: trimmed,
            howToMode: opts?.howToMode,
            limitToHowToId: opts?.limitToHowToId,
            handbookMode: opts?.handbookMode ?? retrievalMode?.handbookMode,
            limitToHandbookPageId: opts?.limitToHandbookPageId ?? retrievalMode?.limitToHandbookPageId,
            contentBlocks: opts?.contentBlocks,
            boundContent: pendingScope,
            clientContext,
            title: newThreadTitle,
          };
          const created = operatorMode
            ? await AssistantService.createOperator(input)
            : await AssistantService.create(input);
          const msgs = await AssistantMessageService.findByAssistant({ assistantId: created.id });
          setAssistant(created);
          setMessages(msgs);
          setThreads((prev) =>
            prev.some((row) => row.id === created.id)
              ? prev.map((row) => (row.id === created.id ? created : row))
              : [created, ...prev],
          );
          if (manageUrl && typeof window !== "undefined") {
            window.history.replaceState(null, "", resolveThreadUrl(created.id));
          }
        } else {
          const result = operatorMode
            ? await AssistantService.appendMessageOperator({
                assistantId: assistant.id,
                content: trimmed,
                contentBlocks: opts?.contentBlocks,
                clientContext,
              })
            : await AssistantService.appendMessage({
                assistantId: assistant.id,
                content: trimmed,
                howToMode: opts?.howToMode,
                limitToHowToId: opts?.limitToHowToId,
                handbookMode: opts?.handbookMode ?? retrievalMode?.handbookMode,
                limitToHandbookPageId: opts?.limitToHandbookPageId ?? retrievalMode?.limitToHandbookPageId,
                contentBlocks: opts?.contentBlocks,
                clientContext,
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
        if (!assistant) socket?.off("assistant:created", createdHandler);
        setSending(false);
        setStatus(undefined);
      }
    },
    [
      assistant,
      messages,
      socket,
      operatorMode,
      pendingScope,
      retrievalMode,
      manageUrl,
      resolveThreadUrl,
      clientContext,
      newThreadTitle,
    ],
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
    setOperatorMode(defaultOperatorMode);
    setPendingScope(scope);
    if (manageUrl && typeof window !== "undefined") {
      window.history.replaceState(null, "", resolveThreadUrl());
    }
  }, [manageUrl, resolveThreadUrl, scope, defaultOperatorMode]);

  // The host's default can settle after the first render (a plan read that arrives
  // late). While no conversation is open, follow it, so a new conversation starts on
  // the Assistant the host asked for. An open conversation keeps its own engine. Only a
  // CHANGE of the default acts: on mount the initial state already holds it, and a host
  // that sets the mode itself when it mounts (Wyrdli's Ask sheet) must not be overridden.
  const previousDefaultOperatorMode = useRef(defaultOperatorMode);
  const hasOpenThread = useRef(!!assistant);
  hasOpenThread.current = !!assistant;
  useEffect(() => {
    if (previousDefaultOperatorMode.current === defaultOperatorMode) return;
    previousDefaultOperatorMode.current = defaultOperatorMode;
    if (!hasOpenThread.current) setOperatorMode(defaultOperatorMode);
  }, [defaultOperatorMode]);

  const setScope = useCallback(
    (next?: { type: string; id: string }) => {
      // An existing thread is already bound; its scope cannot change.
      if (assistant) return;
      setPendingScope(next);
    },
    [assistant],
  );

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

  // The skill list is a convenience for the `/` menu: a failed read gives an
  // empty list and the message still sends. Apps without the Skill module
  // never make the request.
  const refreshSkills = useCallback(async (): Promise<SkillInterface[]> => {
    if (!operatorMode || !ModuleRegistry.has("Skill")) return [];
    try {
      const loaded = await SkillService.findActive();
      const list = Array.isArray(loaded) ? loaded : [];
      if (!operatorModeRef.current) return [];
      setSkills(list);
      return list;
    } catch {
      // A failed read counts as "no skills" (spec section 8.3): drop the list held from before.
      setSkills([]);
      return [];
    }
  }, [operatorMode]);

  useEffect(() => {
    if (operatorMode) {
      void refreshSkills();
    } else {
      setSkills([]);
    }
  }, [operatorMode, refreshSkills]);

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
      scope: pendingScope,
      setScope,
      skills,
      refreshSkills,
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
      pendingScope,
      setScope,
      skills,
      refreshSkills,
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
  // Shaped like the conversations page heading: the open thread's title as the
  // element, and the new-thread action in the shared header so it stays
  // reachable when the thread-list panel is collapsed.
  const title = useMemo(() => {
    const response: { type: string; element?: string; functions?: React.ReactNode } = {
      type: titleOverride ?? t("entities.assistants", { count: assistant ? 1 : 2 }),
    };

    if (assistant?.title) {
      response.element = assistant.title.length > 25 ? `${assistant.title.substring(0, 25)}...` : assistant.title;
    }

    response.functions = [
      <Button
        key="new-assistant"
        data-testid="assistant-new-button"
        size="sm"
        variant={`outline`}
        onClick={(e) => {
          e.preventDefault();
          startNew();
        }}
      >
        <PlusCircleIcon className="me-2 h-3.5 w-3.5" />
        {t("features.assistant.new")}
      </Button>,
    ];

    return response;
  }, [assistant, startNew, t, titleOverride]);

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

/** The Assistant context, or `null` outside an `AssistantProvider` (e.g. a composer mounted on its own). */
export function useAssistantContextOptional(): AssistantContextValue | null {
  return useContext(AssistantContext) ?? null;
}
