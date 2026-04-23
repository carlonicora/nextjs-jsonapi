import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AssistantProvider, useAssistantContext } from "../AssistantContext";
import { AssistantService } from "../../data/AssistantService";
import { AssistantMessageService } from "../../../assistant-message/data/AssistantMessageService";
import { useSocketContext } from "../../../../contexts/SocketContext";
import type { JsonApiHydratedDataInterface } from "../../../../core";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { DataClassRegistry } from "../../../../core/registry/DataClassRegistry";
import { AssistantMessage } from "../../../assistant-message/data/AssistantMessage";
import { Assistant } from "../../data/Assistant";

vi.mock("../../../../contexts/SocketContext", () => ({
  useSocketContext: vi.fn(() => ({ socket: null, isConnected: false })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AssistantProvider>{children}</AssistantProvider>;
}

function buildAssistantStub({ id, title = "Stub" }: { id: string; title?: string }) {
  return { id, title, messageCount: 0, type: "assistants", createdAt: new Date(), updatedAt: new Date() } as any;
}

function buildAssistantDehydrated({
  id,
  title = "Stub",
}: {
  id: string;
  title?: string;
}): JsonApiHydratedDataInterface {
  return {
    jsonApi: {
      type: "assistants",
      id,
      attributes: { title, messageCount: 0 },
    },
    included: [],
  };
}

function buildMessageStub({ role, content = "hi" }: { role: "user" | "assistant"; content?: string }) {
  return { role, content, position: 0, type: "assistant-messages", id: Math.random().toString(36).slice(2) } as any;
}

describe("AssistantContext", () => {
  beforeAll(() => {
    const assistantMessageModule = { name: "assistant-messages", model: AssistantMessage } as any;
    const assistantModule = { name: "assistants", model: Assistant } as any;
    ModuleRegistry.register("AssistantMessage", assistantMessageModule);
    ModuleRegistry.register("Assistant", assistantModule);
    DataClassRegistry.registerObjectClass(assistantMessageModule, AssistantMessage);
    DataClassRegistry.registerObjectClass(assistantModule, Assistant);
  });

  beforeEach(() => {
    vi.mocked(useSocketContext).mockReturnValue({ socket: null, isConnected: false } as any);
    AssistantService.findMany = vi.fn().mockResolvedValue([]);
  });

  it("initial state: no assistant, empty messages, not sending", () => {
    const { result } = renderHook(() => useAssistantContext(), { wrapper });
    expect(result.current.assistant).toBeUndefined();
    expect(result.current.messages).toEqual([]);
    expect(result.current.sending).toBe(false);
  });

  it("sendMessage with no assistant: creates one and swaps URL via replaceState", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    const created = buildAssistantStub({ id: "a-1", title: "Test" });
    const userMsg = buildMessageStub({ role: "user" });
    const assistantMsg = buildMessageStub({ role: "assistant" });
    AssistantService.create = vi.fn().mockResolvedValue(created);
    AssistantMessageService.findByAssistant = vi.fn().mockResolvedValue([userMsg, assistantMsg]);

    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider>{children}</AssistantProvider>,
    });
    await act(async () => {
      await result.current.sendMessage("first question");
    });

    expect(AssistantService.create).toHaveBeenCalledWith({ firstMessage: "first question" });
    expect(AssistantMessageService.findByAssistant).toHaveBeenCalledWith({ assistantId: "a-1" });
    expect(result.current.assistant?.id).toBe("a-1");
    expect(result.current.messages).toHaveLength(2);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/assistants/a-1");
  });

  it("sendMessage with existing assistant: appends [user, assistant]", async () => {
    const existing = buildAssistantDehydrated({ id: "a-2", title: "Existing" });
    AssistantService.appendMessage = vi
      .fn()
      .mockResolvedValue([
        buildMessageStub({ role: "user", content: "follow-up" }),
        buildMessageStub({ role: "assistant", content: "reply" }),
      ]);
    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider dehydratedAssistant={existing}>{children}</AssistantProvider>,
    });
    await act(async () => {
      await result.current.sendMessage("follow-up");
    });
    expect(AssistantService.appendMessage).toHaveBeenCalledWith({ assistantId: "a-2", content: "follow-up" });
    expect(result.current.messages.map((m) => m.content)).toEqual(["follow-up", "reply"]);
  });

  it("selectThread loads messages and replaces URL", async () => {
    const target = buildAssistantStub({ id: "a-3", title: "Target" });
    AssistantService.findOne = vi.fn().mockResolvedValue(target);
    AssistantMessageService.findByAssistant = vi.fn().mockResolvedValue([buildMessageStub({ role: "user" })]);
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider>{children}</AssistantProvider>,
    });
    await act(async () => {
      await result.current.selectThread("a-3");
    });
    expect(AssistantService.findOne).toHaveBeenCalledWith({ id: "a-3" });
    expect(AssistantMessageService.findByAssistant).toHaveBeenCalledWith({ assistantId: "a-3" });
    expect(result.current.assistant?.id).toBe("a-3");
    expect(result.current.messages).toHaveLength(1);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/assistants/a-3");
  });

  it("renameThread calls the service + updates active assistant title", async () => {
    AssistantService.rename = vi.fn().mockResolvedValue(undefined);
    const active = buildAssistantDehydrated({ id: "a-1", title: "Old" });
    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider dehydratedAssistant={active}>{children}</AssistantProvider>,
    });
    await act(async () => {
      await result.current.renameThread("a-1", "New");
    });
    expect(AssistantService.rename).toHaveBeenCalledWith({ id: "a-1", title: "New" });
    expect(result.current.assistant?.title).toBe("New");
  });

  it("deleteThread calls the service + clears active if deleted was active", async () => {
    AssistantService.delete = vi.fn().mockResolvedValue(undefined);
    const active = buildAssistantDehydrated({ id: "a-1", title: "A" });
    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider dehydratedAssistant={active}>{children}</AssistantProvider>,
    });
    await act(async () => {
      await result.current.deleteThread("a-1");
    });
    expect(AssistantService.delete).toHaveBeenCalledWith({ id: "a-1" });
    expect(result.current.assistant).toBeUndefined();
    expect(result.current.messages).toEqual([]);
  });

  it("loads threads on mount", async () => {
    const t1 = buildAssistantStub({ id: "t1", title: "T1" });
    AssistantService.findMany = vi.fn().mockResolvedValue([t1]);
    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider>{children}</AssistantProvider>,
    });
    await waitFor(() => expect(result.current.threads).toEqual([t1]));
  });

  it("subscribes to assistant:status while sending and unsubscribes after", async () => {
    const handlers: Record<string, (payload: any) => void> = {};
    const socket = {
      on: vi.fn((evt: string, h: any) => {
        handlers[evt] = h;
      }),
      off: vi.fn((evt: string) => {
        delete handlers[evt];
      }),
    };
    vi.mocked(useSocketContext).mockReturnValue({ socket, isConnected: true } as any);

    const created = buildAssistantStub({ id: "a-4", title: "Stub" });
    AssistantService.create = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(created), 20)));
    AssistantMessageService.findByAssistant = vi.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider>{children}</AssistantProvider>,
    });
    let sendPromise: Promise<void>;
    await act(async () => {
      sendPromise = result.current.sendMessage("go");
      // allow subscription to register before the create resolves
      await Promise.resolve();
    });
    await waitFor(() => expect(socket.on).toHaveBeenCalledWith("assistant:status", expect.any(Function)));
    handlers["assistant:status"]?.({ assistantId: "a-4", status: "Searching accounts", at: new Date().toISOString() });
    await act(async () => {
      await sendPromise!;
    });
    expect(socket.off).toHaveBeenCalledWith("assistant:status", expect.any(Function));
  });

  it("exposes an empty failedMessageIds set and a retrySend callback", () => {
    const { result } = renderHook(() => useAssistantContext(), { wrapper });
    expect(result.current.failedMessageIds).toBeInstanceOf(Set);
    expect(result.current.failedMessageIds.size).toBe(0);
    expect(typeof result.current.retrySend).toBe("function");
  });

  it("sendMessage (existing assistant): shows the user bubble synchronously before the server responds", async () => {
    const existing = buildAssistantDehydrated({ id: "a-2", title: "Existing" });
    let resolveAppend!: (value: any) => void;
    AssistantService.appendMessage = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAppend = resolve;
        }),
    );
    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider dehydratedAssistant={existing}>{children}</AssistantProvider>,
    });

    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage("follow-up");
    });

    // Before the server responds, the optimistic user bubble must be visible.
    expect(result.current.messages.map((m) => m.content)).toContain("follow-up");
    expect(result.current.messages.some((m) => m.id.startsWith("tmp-") && m.role === "user")).toBe(true);
    expect(result.current.sending).toBe(true);

    await act(async () => {
      resolveAppend([
        buildMessageStub({ role: "user", content: "follow-up" }),
        buildMessageStub({ role: "assistant", content: "reply" }),
      ]);
      await sendPromise!;
    });

    // After reconciliation, no tmp-* remains, and server messages are appended.
    expect(result.current.messages.some((m) => m.id.startsWith("tmp-"))).toBe(false);
    expect(result.current.messages.map((m) => m.content)).toEqual(["follow-up", "reply"]);
    expect(result.current.sending).toBe(false);
  });

  it("sendMessage (no assistant): shows the user bubble synchronously before create resolves", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    const created = buildAssistantStub({ id: "a-1", title: "Test" });
    const userMsg = buildMessageStub({ role: "user", content: "first question" });
    const assistantMsg = buildMessageStub({ role: "assistant", content: "answer" });

    let resolveCreate!: (value: any) => void;
    AssistantService.create = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    AssistantMessageService.findByAssistant = vi.fn().mockResolvedValue([userMsg, assistantMsg]);

    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider>{children}</AssistantProvider>,
    });

    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage("first question");
    });

    // Before the server responds: thread has exactly the optimistic user bubble.
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id.startsWith("tmp-")).toBe(true);
    expect(result.current.messages[0].content).toBe("first question");
    expect(result.current.assistant).toBeUndefined();
    expect(result.current.sending).toBe(true);

    await act(async () => {
      resolveCreate(created);
      await sendPromise!;
    });

    // After reconciliation: assistant set, URL replaced, server messages only.
    expect(result.current.assistant?.id).toBe("a-1");
    expect(result.current.messages.some((m) => m.id.startsWith("tmp-"))).toBe(false);
    expect(result.current.messages).toHaveLength(2);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/assistants/a-1");
  });

  it("sendMessage failure: optimistic message stays and its id lands in failedMessageIds", async () => {
    const existing = buildAssistantDehydrated({ id: "a-x", title: "Ex" });
    AssistantService.appendMessage = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider dehydratedAssistant={existing}>{children}</AssistantProvider>,
    });

    await act(async () => {
      await result.current.sendMessage("oops").catch(() => {});
    });

    const optimistic = result.current.messages.find((m) => m.id.startsWith("tmp-"));
    expect(optimistic).toBeDefined();
    expect(optimistic!.content).toBe("oops");
    expect(result.current.failedMessageIds.has(optimistic!.id)).toBe(true);
    expect(result.current.sending).toBe(false);
  });

  it("retrySend: clears the failed id, removes the old tmp message, and resends the content", async () => {
    const existing = buildAssistantDehydrated({ id: "a-y", title: "Ey" });
    const appendMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail-1"))
      .mockResolvedValueOnce([
        buildMessageStub({ role: "user", content: "retry-me" }),
        buildMessageStub({ role: "assistant", content: "ok" }),
      ]);
    AssistantService.appendMessage = appendMock;

    const { result } = renderHook(() => useAssistantContext(), {
      wrapper: ({ children }) => <AssistantProvider dehydratedAssistant={existing}>{children}</AssistantProvider>,
    });

    await act(async () => {
      await result.current.sendMessage("retry-me").catch(() => {});
    });
    const failedId = [...result.current.failedMessageIds][0];
    expect(failedId).toBeDefined();

    await act(async () => {
      await result.current.retrySend(failedId!);
    });

    expect(result.current.failedMessageIds.has(failedId!)).toBe(false);
    expect(result.current.messages.some((m) => m.id.startsWith("tmp-"))).toBe(false);
    expect(result.current.messages.map((m) => m.content)).toEqual(["retry-me", "ok"]);
    expect(appendMock).toHaveBeenCalledTimes(2);
  });
});
