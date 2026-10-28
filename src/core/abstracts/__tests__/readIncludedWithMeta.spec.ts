import { describe, it, expect, beforeEach } from "vitest";
import { AbstractApiData } from "../AbstractApiData";
import { DataClassRegistry } from "../../registry/DataClassRegistry";
import { ApiDataInterface } from "../../interfaces/ApiDataInterface";
import { JsonApiHydratedDataInterface } from "../../interfaces/JsonApiHydratedDataInterface";
import { ApiRequestDataTypeInterface } from "../../interfaces/ApiRequestDataTypeInterface";

// Concrete test class to access the protected method
class TestModel extends AbstractApiData {
  public testReadIncludedWithMeta<T extends ApiDataInterface, M extends Record<string, any>>(
    data: JsonApiHydratedDataInterface,
    type: string,
    dataType: ApiRequestDataTypeInterface,
  ): (T & M) | (T & M)[] | undefined {
    return this._readIncludedWithMeta<T, M>(data, type, dataType);
  }
}

// Mirrors an app model that exposes the relationship meta through a getter only (a360ai's Chunk)
class MockChunk extends AbstractApiData {
  private _relevance?: number;

  get relevance(): number {
    return this._relevance ?? 0;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }
}

const chunkModule: ApiRequestDataTypeInterface = {
  name: "chunks",
  model: MockChunk,
} as any;

describe("_readIncludedWithMeta", () => {
  beforeEach(() => {
    DataClassRegistry.clear();
    DataClassRegistry.registerObjectClass(chunkModule, MockChunk);
  });

  it("merges per-item meta onto a model whose property is a getter only", () => {
    // GIVEN: an assistant message citing two chunks with relevance meta on the relationship
    const data: JsonApiHydratedDataInterface = {
      jsonApi: {
        id: "message-1",
        type: "assistant-messages",
        attributes: {},
        relationships: {
          citations: {
            data: [
              { id: "chunk-1", type: "chunks", meta: { relevance: 0.9, reason: "names the deadline" } },
              { id: "chunk-2", type: "chunks", meta: { relevance: 0.4 } },
            ],
          },
        },
      },
      included: [
        { id: "chunk-1", type: "chunks", attributes: { content: "a" } },
        { id: "chunk-2", type: "chunks", attributes: { content: "b" } },
      ],
    };

    // WHEN: the citations are read with their meta
    const result = new TestModel().testReadIncludedWithMeta<MockChunk, { relevance: number; reason?: string }>(
      data,
      "citations",
      chunkModule,
    ) as (MockChunk & { reason?: string })[];

    // THEN: no TypeError, and the getter-only property reads the meta value
    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(MockChunk);
    expect(result[0].relevance).toBe(0.9);
    expect(result[0].reason).toBe("names the deadline");
    expect(result[1].relevance).toBe(0.4);
  });

  it("merges relationship-level meta on a single relationship", () => {
    const data: JsonApiHydratedDataInterface = {
      jsonApi: {
        id: "message-1",
        type: "assistant-messages",
        attributes: {},
        relationships: {
          topCitation: { data: { id: "chunk-1", type: "chunks" }, meta: { relevance: 0.7 } },
        },
      },
      included: [{ id: "chunk-1", type: "chunks", attributes: { content: "a" } }],
    };

    const result = new TestModel().testReadIncludedWithMeta<MockChunk, { relevance: number }>(
      data,
      "topCitation",
      chunkModule,
    ) as MockChunk;

    expect(result).toBeInstanceOf(MockChunk);
    expect(result.relevance).toBe(0.7);
  });
});
