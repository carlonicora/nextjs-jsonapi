import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AbstractService } from "../../../../core/abstracts/AbstractService";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { HandbookThread } from "../HandbookThread";
import { HandbookThreadMessage } from "../HandbookThreadMessage";
import { HandbookThreadMessageService } from "../HandbookThreadMessageService";
import { HandbookThreadService } from "../HandbookThreadService";

// ModuleRegistry is backed by a globalThis symbol shared across test files in a
// worker, hence the register-if-absent guard (same idiom as
// Assistant.scope.spec.ts).
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("HandbookThread", { name: "handbookthreads", model: HandbookThread } as any);
  registerIfAbsent("HandbookThreadMessage", {
    name: "handbookthreadmessages",
    model: HandbookThreadMessage,
  } as any);
});

// `callApi` is a protected static on AbstractService; the services inherit it,
// so spying on the base class intercepts every call without touching the HTTP
// layer.
type CallApiParams = {
  method: string;
  endpoint: string;
  input?: unknown;
  next?: unknown;
  overridesJsonApiCreation?: boolean;
};
const callApi = () => vi.spyOn(AbstractService as any, "callApi");
const firstCall = (spy: ReturnType<typeof callApi>): CallApiParams => spy.mock.calls[0][0] as CallApiParams;

describe("HandbookThreadService.findMany", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("forwards the pagination cursor — `useDataListRetriever` pages through it", async () => {
    const spy = callApi().mockResolvedValue([]);

    await HandbookThreadService.findMany({ next: { next: "handbookthreads?page[cursor]=42" } });

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ next: { next: "handbookthreads?page[cursor]=42" } }));
  });

  it("still calls with an undefined cursor on the first page", async () => {
    const spy = callApi().mockResolvedValue([]);

    await HandbookThreadService.findMany();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ next: undefined }));
  });

  it("passes search and fetchAll through to the endpoint", async () => {
    const spy = callApi().mockResolvedValue([]);

    await HandbookThreadService.findMany({ search: "cypher", fetchAll: true });

    const endpoint = firstCall(spy).endpoint;
    expect(endpoint).toContain("handbookthreads");
    expect(endpoint).toContain("cypher");
    expect(endpoint).toContain("fetchAll");
  });
});

describe("HandbookThreadService mutations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a thread from the question alone and lets the model build the envelope", async () => {
    const spy = callApi().mockResolvedValue({});

    await HandbookThreadService.create({ id: "client-1", question: "  " });

    const call = firstCall(spy);
    expect(call.method).toBe("POST");
    expect(call.input).toEqual({ id: "client-1", question: "  " });
    expect(call.overridesJsonApiCreation).toBeUndefined();
  });

  it("renames through the model's dedicated envelope, never a hand-built one", async () => {
    const spy = callApi().mockResolvedValue(undefined);

    await HandbookThreadService.rename({ id: "t1", title: "Filtri di azienda" });

    const call = firstCall(spy);
    expect(call.method).toBe("PATCH");
    expect(call.input).toEqual(new HandbookThread().createRenameJsonApi({ id: "t1", title: "Filtri di azienda" }));
  });
});

describe("HandbookThreadMessageService.ask", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("posts the question to the thread's message collection", async () => {
    const spy = callApi().mockResolvedValue(undefined);

    await HandbookThreadMessageService.ask({ id: "m1", threadId: "t1", question: "Come funziona?" });

    const call = firstCall(spy);
    expect(call.method).toBe("POST");
    expect(call.endpoint).toContain("handbookthreads/t1/handbookthreadmessages");
    expect(call.input).toEqual({ id: "m1", question: "Come funziona?" });
  });
});
