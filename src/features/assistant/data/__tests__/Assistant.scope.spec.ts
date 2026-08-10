import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { Assistant } from "../Assistant";

// `createJsonApi()` reads `Modules.Assistant.name` for the JSON:API `type`, so
// the module must exist in the registry. ModuleRegistry is backed by a
// globalThis symbol shared across test files in a worker, hence the
// register-if-absent guard (same idiom as AssistantAction.spec.ts).
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("Assistant", { name: "assistants", model: Assistant } as any);
});

describe("Assistant.createJsonApi", () => {
  it("emits the bound content relationship", () => {
    const payload: any = new Assistant().createJsonApi({
      firstMessage: "hello",
      boundContent: { type: "campaigns", id: "camp-1" },
    });

    expect(payload.data.relationships.content).toEqual({ data: { type: "campaigns", id: "camp-1" } });
    expect(payload.data.attributes.content).toBe("hello");
  });

  it("emits contentBlocks when the composer supplied a rich document", () => {
    const blocks = [{ type: "paragraph", content: [] }];
    const payload: any = new Assistant().createJsonApi({ firstMessage: "hello", contentBlocks: blocks });
    expect(payload.data.attributes.contentBlocks).toBe(blocks);
  });

  it("omits the relationships key entirely when no content is bound", () => {
    const payload: any = new Assistant().createJsonApi({ firstMessage: "hello" });
    expect(payload.data.relationships?.content).toBeUndefined();
  });
});

describe("Assistant.rehydrate", () => {
  it("exposes the bound content type and id", () => {
    const assistant = new Assistant().rehydrate({
      jsonApi: {
        type: "assistants",
        id: "a1",
        attributes: { title: "T" },
        relationships: { content: { data: { type: "campaigns", id: "camp-1" } } },
      },
      included: [],
    } as any);

    expect(assistant.boundContentType).toBe("campaigns");
    expect(assistant.boundContentId).toBe("camp-1");
  });
});
