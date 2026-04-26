import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AbstractApiData } from "../../../../core/abstracts/AbstractApiData";
import { DataClassRegistry } from "../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { JsonApiHydratedDataInterface } from "../../../../core/interfaces/JsonApiHydratedDataInterface";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { AssistantMessage } from "../AssistantMessage";
import { Chunk } from "../../../chunk/data/Chunk";

// ---------------------------------------------------------------------------
// Minimal test-only model — avoids collision with any real app module.
// identifierFields = ["name"] resolves "Acme" from attributes.name.
// ---------------------------------------------------------------------------
class TestAccount extends AbstractApiData {
  static identifierFields: string[] = ["name"];

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }

  createJsonApi(_data?: any): any {
    return {};
  }
}

const testAccountModule: ApiRequestDataTypeInterface = {
  name: "test-accounts",
  model: TestAccount,
} as any;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
const assistantMessageModule: ApiRequestDataTypeInterface = {
  name: "assistant-messages",
  model: AssistantMessage,
} as any;

const assistantModule: ApiRequestDataTypeInterface = {
  name: "assistants",
  model: class {},
} as any;

const chunkModule: ApiRequestDataTypeInterface = {
  name: "chunks",
  model: Chunk,
} as any;

beforeAll(() => {
  DataClassRegistry.clear();
  DataClassRegistry.registerObjectClass(testAccountModule, TestAccount);
  DataClassRegistry.registerObjectClass(chunkModule, Chunk);
  ModuleRegistry.register("TestAccount", testAccountModule);
  ModuleRegistry.register("AssistantMessage", assistantMessageModule);
  ModuleRegistry.register("Assistant", assistantModule);
  ModuleRegistry.register("Chunk", chunkModule);
});

afterAll(() => {
  DataClassRegistry.clear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRehydratedMessage(jsonApiData: any, included: any[] = []): AssistantMessage {
  const data: JsonApiHydratedDataInterface = {
    jsonApi: jsonApiData,
    included,
  };
  return new AssistantMessage().rehydrate(data);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("AssistantMessage.rehydrate", () => {
  it("rehydrates `references` as an array of the correct Module's model", () => {
    // GIVEN: JSON:API assistant-message with a `references` relationship pointing to
    // a test-accounts entity, plus that entity in the `included` array.
    const jsonApiData = {
      id: "msg-1",
      type: "assistant-messages",
      attributes: {
        role: "assistant",
        content: "Here is the account.",
        position: 1,
      },
      relationships: {
        references: {
          data: [{ type: "test-accounts", id: "acc-1" }],
        },
      },
    };
    const included = [
      {
        type: "test-accounts",
        id: "acc-1",
        attributes: { name: "Acme" },
      },
    ];

    // WHEN
    const message = makeRehydratedMessage(jsonApiData, included);

    // THEN: references should contain one hydrated TestAccount instance
    expect(message.references).toHaveLength(1);

    const ref = message.references[0] as any;
    // Type and id should be populated from the included entry
    expect(ref.type).toBe("test-accounts");
    expect(ref.id).toBe("acc-1");
    // identifier reads from identifierFields = ["name"] → attributes.name = "Acme"
    expect(ref.identifier).toBe("Acme");
  });

  it("returns an empty array when the relationship is absent", () => {
    // GIVEN: JSON:API assistant-message with no `references` attribute or relationship
    const jsonApiData = {
      id: "msg-2",
      type: "assistant-messages",
      attributes: {
        role: "user",
        content: "Hello.",
        position: 0,
      },
    };

    // WHEN
    const message = makeRehydratedMessage(jsonApiData, []);

    // THEN
    expect(message.references).toEqual([]);
  });
});

describe("AssistantMessage.buildOptimistic", () => {
  it("creates a user message with a tmp-prefixed id and the given content + position", () => {
    const msg = AssistantMessage.buildOptimistic({
      content: "hello",
      assistantId: "a-1",
      position: 3,
    });

    expect(msg.id.startsWith("tmp-")).toBe(true);
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("hello");
    expect(msg.position).toBe(3);
  });

  it("allows an omitted assistantId (first-message case)", () => {
    const msg = AssistantMessage.buildOptimistic({ content: "first", position: 1 });

    expect(msg.id.startsWith("tmp-")).toBe(true);
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("first");
    expect(msg.position).toBe(1);
  });

  it("produces distinct ids across successive calls", () => {
    const a = AssistantMessage.buildOptimistic({ content: "x", position: 1 });
    const b = AssistantMessage.buildOptimistic({ content: "x", position: 2 });
    expect(a.id).not.toEqual(b.id);
  });
});
