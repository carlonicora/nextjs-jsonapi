import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { AssistantMessage } from "../AssistantMessage";
import { Chunk } from "../../../chunk/data/Chunk";
import { DataClassRegistry } from "../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";

const chunkModule: ApiRequestDataTypeInterface = {
  name: "chunks",
  model: Chunk,
} as any;

beforeAll(() => {
  DataClassRegistry.clear();
  DataClassRegistry.registerObjectClass(chunkModule, Chunk);
  ModuleRegistry.register("Chunk", chunkModule);
});

afterAll(() => {
  DataClassRegistry.clear();
});

describe("AssistantMessage citations rehydration", () => {
  it("rehydrates citations with edge meta (relevance, reason)", () => {
    const msg = new AssistantMessage();
    msg.rehydrate({
      jsonApi: {
        id: "m1",
        type: "assistant-messages",
        attributes: { role: "assistant", content: "answer", position: 1 },
        relationships: {
          citations: {
            data: [{ type: "chunks", id: "c1", meta: { relevance: 0.9, reason: "primary source" } }],
          },
        },
      } as any,
      included: [
        {
          id: "c1",
          type: "chunks",
          attributes: { content: "evidence text" },
          meta: { nodeId: "doc-1", nodeType: "documents" },
        },
      ],
    });

    expect(msg.citations).toHaveLength(1);
    expect(msg.citations[0].content).toBe("evidence text");
    expect((msg.citations[0] as any).relevance).toBe(0.9);
    expect((msg.citations[0] as any).reason).toBe("primary source");
  });

  it("returns [] when citations relationship is absent", () => {
    const msg = new AssistantMessage();
    msg.rehydrate({
      jsonApi: {
        id: "m2",
        type: "assistant-messages",
        attributes: { role: "assistant", content: "x", position: 0 },
      } as any,
      included: [],
    });
    expect(msg.citations).toEqual([]);
  });
});
