import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { Assistant } from "../Assistant";

describe("Assistant model", () => {
  it("rehydrates engine from attributes (operator thread)", () => {
    const assistant = new Assistant().rehydrate({
      jsonApi: { type: "assistants", id: "a-1", attributes: { title: "T", engine: "operator" } },
      included: [],
    });
    expect(assistant.engine).toBe("operator");
    expect(assistant.title).toBe("T");
  });

  it("leaves engine undefined when the attribute is absent (responder thread)", () => {
    const assistant = new Assistant().rehydrate({
      jsonApi: { type: "assistants", id: "a-2", attributes: { title: "T" } },
      included: [],
    });
    expect(assistant.engine).toBeUndefined();
  });

  it("preserves engine through dehydrate/rehydrate round-trips", () => {
    const original = new Assistant().rehydrate({
      jsonApi: { type: "assistants", id: "a-3", attributes: { title: "T", engine: "operator" } },
      included: [],
    });
    const roundTripped = new Assistant().rehydrate(original.dehydrate());
    expect(roundTripped.engine).toBe("operator");
  });
});

// createJsonApi reads Modules.Assistant.name; the registry is shared across
// files in a worker, so register only when absent.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

describe("Assistant.createJsonApi clientContext", () => {
  beforeAll(() => {
    registerIfAbsent("Assistant", { name: "assistants", model: Assistant } as any);
  });

  it("createJsonApi carries clientContext as an attribute when given", () => {
    const payload: any = new Assistant().createJsonApi({ firstMessage: "hello", clientContext: { a: "b" } });
    expect(payload.data.attributes.clientContext).toEqual({ a: "b" });
  });

  it("createJsonApi omits clientContext when not given", () => {
    const payload: any = new Assistant().createJsonApi({ firstMessage: "hello" });
    expect("clientContext" in payload.data.attributes).toBe(false);
  });
});
