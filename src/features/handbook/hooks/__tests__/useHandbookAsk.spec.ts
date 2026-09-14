import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { DataClassRegistry } from "../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { HandbookThread } from "../../data/HandbookThread";
import { HandbookThreadMessage } from "../../data/HandbookThreadMessage";
import { HandbookThreadMessageService } from "../../data/HandbookThreadMessageService";
import { HandbookThreadService } from "../../data/HandbookThreadService";
import { useHandbookAsk } from "../useHandbookAsk";

vi.mock("../../data/HandbookThreadService", () => ({
  HandbookThreadService: {
    findMany: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    rename: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../data/HandbookThreadMessageService", () => ({
  HandbookThreadMessageService: { ask: vi.fn() },
}));

// The models resolve Modules.HandbookThread / Modules.HandbookThreadMessage
// lazily through ModuleRegistry, and `_readIncluded` resolves the CONSTRUCTOR
// through DataClassRegistry. Registering both is the package's spec convention
// (see HandbookAskContainer.spec.tsx) and is preferred to mocking the core
// barrel the hook also reads `rehydrate` from.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("HandbookPage", { name: "handbookpages", pageUrl: "/administration/handbook" } as any);
  const threadModule = { name: "handbookthreads", model: HandbookThread } as any;
  const messageModule = { name: "handbookthreadmessages", model: HandbookThreadMessage } as any;
  registerIfAbsent("HandbookThread", threadModule);
  registerIfAbsent("HandbookThreadMessage", messageModule);
  DataClassRegistry.registerObjectClass(threadModule, HandbookThread as any);
  DataClassRegistry.registerObjectClass(messageModule, HandbookThreadMessage as any);
});

function buildThread(params: {
  id: string;
  title: string;
  messages?: { id: string; role: "user" | "assistant"; content: string; position: number; sources?: string[] }[];
}): HandbookThread {
  const messages = params.messages ?? [];
  return new HandbookThread().rehydrate({
    jsonApi: {
      id: params.id,
      type: "handbookthreads",
      attributes: { title: params.title },
      meta: { updatedAt: new Date().toISOString() },
      relationships: {
        messages: { data: messages.map((m) => ({ id: m.id, type: "handbookthreadmessages" })) },
      },
    },
    included: messages.map((m) => ({
      id: m.id,
      type: "handbookthreadmessages",
      attributes: { role: m.role, content: m.content, position: m.position, sources: m.sources ?? [] },
    })),
  } as any);
}

const answered = (id: string) =>
  buildThread({
    id,
    title: "Filtri di azienda",
    messages: [
      { id: "m1", role: "user", content: "Perché?", position: 0 },
      { id: "m2", role: "assistant", content: "Inietta il filtro di azienda.", position: 1 },
    ],
  });

describe("useHandbookAsk", () => {
  beforeEach(() => {
    vi.mocked(HandbookThreadService.findMany).mockReset().mockResolvedValue([]);
    vi.mocked(HandbookThreadService.findOne).mockReset().mockResolvedValue(answered("t1"));
    vi.mocked(HandbookThreadService.create)
      .mockReset()
      .mockResolvedValue(buildThread({ id: "t1", title: "" }));
    vi.mocked(HandbookThreadMessageService.ask).mockReset().mockResolvedValue(undefined);
  });

  it("adds an optimistic user message then replaces the transcript from the read-back", async () => {
    const { result } = renderHook(() => useHandbookAsk());

    await act(async () => {
      await result.current.ask("How do migrations run?");
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(HandbookThreadService.findOne).toHaveBeenCalledWith({ id: "t1" });
    expect(result.current.thread?.id).toBe("t1");
  });

  it("passes handbookPageId to the create call when one is supplied", async () => {
    const { result } = renderHook(() => useHandbookAsk({ syncUrl: false }));

    await act(async () => {
      await result.current.ask("Why?", { handbookPageId: "p2" });
    });

    expect(HandbookThreadService.create).toHaveBeenCalledWith(expect.objectContaining({ handbookPageId: "p2" }));
  });

  it("passes handbookPageId to the append call on an open thread", async () => {
    const { result } = renderHook(() => useHandbookAsk({ syncUrl: false, handbookThreadId: "t1" }));
    await waitFor(() => expect(result.current.thread?.id).toBe("t1"));

    await act(async () => {
      await result.current.ask("Why?", { handbookPageId: "p2" });
    });

    expect(HandbookThreadMessageService.ask).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: "t1", handbookPageId: "p2" }),
    );
    expect(HandbookThreadService.create).not.toHaveBeenCalled();
  });

  it("keeps the url on the open thread by default", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => useHandbookAsk());

    await act(async () => {
      await result.current.ask("Why?");
    });

    expect(replaceState).toHaveBeenCalledWith(null, "", "/administration/handbook/chat/t1");
    replaceState.mockRestore();
  });

  it("does not touch the URL when syncUrl is false", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => useHandbookAsk({ syncUrl: false }));

    await act(async () => {
      await result.current.ask("Why?");
    });

    expect(replaceState).not.toHaveBeenCalled();
    replaceState.mockRestore();
  });

  it("appends one assistant-side failure message when the API rejects", async () => {
    vi.mocked(HandbookThreadService.create).mockRejectedValueOnce(new Error("400"));
    const { result } = renderHook(() => useHandbookAsk());

    await act(async () => {
      await result.current.ask("Why?");
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages.at(-1)?.role).toBe("assistant");
    expect(result.current.messages.at(-1)?.content).toBe("handbook.chat.failed");
    // The asked question stays in the transcript.
    expect(result.current.messages[0].content).toBe("Why?");
  });

  it("opens the routed thread on mount without rewriting the url", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    const { result } = renderHook(() => useHandbookAsk({ handbookThreadId: "t1" }));

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(HandbookThreadService.findOne).toHaveBeenCalledWith({ id: "t1" });
    expect(replaceState).not.toHaveBeenCalled();
    replaceState.mockRestore();
  });

  it("loads the thread list and reloads the transcript on select", async () => {
    vi.mocked(HandbookThreadService.findMany).mockResolvedValue([
      buildThread({ id: "t1", title: "Filtri di azienda" }),
    ]);
    const { result } = renderHook(() => useHandbookAsk());

    await waitFor(() => expect(result.current.threads).toHaveLength(1));

    await act(async () => {
      await result.current.selectThread("t1");
    });

    expect(result.current.messages).toHaveLength(2);

    act(() => result.current.startNew());
    expect(result.current.thread).toBeUndefined();
    expect(result.current.messages).toHaveLength(0);
  });
});
