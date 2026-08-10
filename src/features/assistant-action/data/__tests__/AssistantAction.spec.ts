import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AbstractService } from "../../../../core/abstracts/AbstractService";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { AssistantAction } from "../AssistantAction";
import { AssistantActionService } from "../AssistantActionService";

// ---------------------------------------------------------------------------
// Setup / teardown — the services resolve their endpoints through the real
// ModuleRegistry, so the two modules the feature touches must be registered.
// ---------------------------------------------------------------------------
const assistantActionModule: ApiRequestDataTypeInterface = {
  name: "assistant-actions",
  model: AssistantAction,
} as any;

const assistantMessageModule: ApiRequestDataTypeInterface = {
  name: "assistant-messages",
  model: class {},
} as any;

// `callApi` is protected static on AbstractService; spying on it there covers
// every subclass through the static prototype chain.
let callApiMock: ReturnType<typeof vi.fn>;

const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("AssistantAction", assistantActionModule);
  registerIfAbsent("AssistantMessage", assistantMessageModule);
  callApiMock = vi.spyOn(AbstractService as any, "callApi") as unknown as ReturnType<typeof vi.fn>;
});

afterAll(() => {
  vi.restoreAllMocks();
});

function makeHydratedData(overrides: Record<string, any> = {}) {
  return {
    jsonApi: {
      id: "action-1",
      type: "assistant-actions",
      attributes: {
        status: "pending",
        toolName: "createNpc",
        toolArgs: '{"name":"A"}',
        summary: "Create a new record",
        threadId: "thread-1",
        userModuleIds: ["module-1"],
        expiresAt: "2026-06-10T12:00:00.000Z",
        ...overrides,
      },
      meta: {},
      relationships: {},
    },
    included: [],
  };
}

describe("AssistantAction model", () => {
  it("rehydrates status, toolName and summary", () => {
    const action = new AssistantAction();
    action.rehydrate(makeHydratedData() as any);

    expect(action.id).toBe("action-1");
    expect(action.status).toBe("pending");
    expect(action.toolName).toBe("createNpc");
    expect(action.summary).toBe("Create a new record");
  });

  it("parses expiresAt into a Date", () => {
    const action = new AssistantAction();
    action.rehydrate(makeHydratedData() as any);

    expect(action.expiresAt).toBeInstanceOf(Date);
    expect(action.expiresAt).toEqual(new Date("2026-06-10T12:00:00.000Z"));
  });

  it("parses resolvedAt into a Date when present", () => {
    const action = new AssistantAction();
    action.rehydrate(makeHydratedData({ status: "approved", resolvedAt: "2026-06-10T11:30:00.000Z" }) as any);

    expect(action.status).toBe("approved");
    expect(action.resolvedAt).toBeInstanceOf(Date);
    expect(action.resolvedAt).toEqual(new Date("2026-06-10T11:30:00.000Z"));
  });

  it("leaves resolvedAt undefined when absent", () => {
    const action = new AssistantAction();
    action.rehydrate(makeHydratedData() as any);

    expect(action.resolvedAt).toBeUndefined();
  });

  it("returns defaults for missing attributes", () => {
    const action = new AssistantAction();
    action.rehydrate({
      jsonApi: {
        id: "action-1",
        type: "assistant-actions",
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    } as any);

    // Missing status defaults to the fail-safe, non-actionable "expired" — never the actionable "pending".
    expect(action.status).toBe("expired");
    expect(action.toolName).toBe("");
    expect(action.summary).toBe("");
    expect(action.resolvedAt).toBeUndefined();
    expect(action.expiresAt).toBeUndefined();
  });

  it("creates a minimal JSON:API payload (id only)", () => {
    const action = new AssistantAction();
    const payload = action.createJsonApi({ id: "action-1" });

    expect(payload.data.type).toBe("assistant-actions");
    expect(payload.data.id).toBe("action-1");
    expect(payload.data.attributes).toEqual({});
  });
});

describe("AssistantActionService", () => {
  beforeEach(() => {
    // mockClear (not mockReset): on a spy, mockReset would restore the real
    // callApi and the assertions would fire a network request.
    callApiMock.mockClear();
    callApiMock.mockResolvedValue({});
  });

  it("findOne GETs the action typed as Modules.AssistantAction", async () => {
    await AssistantActionService.findOne({ id: "action-1" });

    expect(callApiMock).toHaveBeenCalledTimes(1);
    const call = callApiMock.mock.calls[0][0];
    expect(call.type.name).toBe("assistant-actions");
    expect(call.method).toBe("GET");
    expect(call.endpoint).toBe("assistant-actions/action-1");
  });

  it("approve POSTs body-less to /approve typed as Modules.AssistantMessage", async () => {
    await AssistantActionService.approve({ id: "action-1" });

    expect(callApiMock).toHaveBeenCalledTimes(1);
    const call = callApiMock.mock.calls[0][0];
    expect(call.type.name).toBe("assistant-messages");
    expect(call.method).toBe("POST");
    expect(call.endpoint).toBe("assistant-actions/action-1/approve");
    expect(call.input).toBeUndefined();
  });

  it("deny POSTs body-less to /deny typed as Modules.AssistantMessage", async () => {
    await AssistantActionService.deny({ id: "action-1" });

    expect(callApiMock).toHaveBeenCalledTimes(1);
    const call = callApiMock.mock.calls[0][0];
    expect(call.type.name).toBe("assistant-messages");
    expect(call.method).toBe("POST");
    expect(call.endpoint).toBe("assistant-actions/action-1/deny");
    expect(call.input).toBeUndefined();
  });
});
