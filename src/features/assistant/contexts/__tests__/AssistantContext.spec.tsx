import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AssistantProvider, useAssistantContext } from "../AssistantContext";
import { AssistantService } from "../../data/AssistantService";
import { AssistantMessageService } from "../../../assistant-message/data/AssistantMessageService";
import { useSocketContext } from "../../../../contexts/SocketContext";

vi.mock("../../../../contexts/SocketContext", () => ({
  useSocketContext: vi.fn(() => ({ socket: null, isConnected: false })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AssistantProvider>{children}</AssistantProvider>;
}

function buildAssistantStub({ id, title = "Stub" }: { id: string; title?: string }) {
  return { id, title, messageCount: 0, type: "assistants", createdAt: new Date(), updatedAt: new Date() } as any;
}

function buildMessageStub({ role, content = "hi" }: { role: "user" | "assistant"; content?: string }) {
  return { role, content, position: 0, type: "assistant-messages", id: Math.random().toString(36).slice(2) } as any;
}

describe("AssistantContext", () => {
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
    const existing = buildAssistantStub({ id: "a-2", title: "Existing" });
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
    const active = buildAssistantStub({ id: "a-1", title: "Old" });
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
    const active = buildAssistantStub({ id: "a-1", title: "A" });
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
});
