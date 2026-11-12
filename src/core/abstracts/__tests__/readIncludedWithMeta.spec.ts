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

// A model with its own getter of an edge field's name: its own value must never be replaced.
class MockChunk extends AbstractApiData {
  private _relevance?: number;

  get relevance(): number {
    return this._relevance ?? 0;
  }

  /** The model's explicit read of the edge value. */
  get edgeRelevance(): number | undefined {
    return this.relationshipMeta<number>("relevance");
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._relevance = data.jsonApi.attributes?.relevance;
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

  it("keeps the model's getter and hands the edge value to relationshipMeta (per-item meta)", () => {
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
        { id: "chunk-1", type: "chunks", attributes: { content: "a", relevance: 0.2 } },
        { id: "chunk-2", type: "chunks", attributes: { content: "b" } },
      ],
    };

    const result = new TestModel().testReadIncludedWithMeta<MockChunk, { relevance: number; reason?: string }>(
      data,
      "citations",
      chunkModule,
    ) as (MockChunk & { reason?: string })[];

    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(MockChunk);
    // The getter returns the record's own value, never the edge value.
    expect(result[0].relevance).toBe(0.2);
    expect(result[1].relevance).toBe(0);
    // The edge value is read explicitly.
    expect(result[0].edgeRelevance).toBe(0.9);
    expect(result[1].edgeRelevance).toBe(0.4);
    // A name the model does not declare is still an own property.
    expect(result[0].reason).toBe("names the deadline");
    expect(Object.getOwnPropertyDescriptor(result[0], "relevance")).toBeUndefined();
  });

  it("keeps the model's getter on a single relationship and reads the relationship-level meta", () => {
    const data: JsonApiHydratedDataInterface = {
      jsonApi: {
        id: "message-1",
        type: "assistant-messages",
        attributes: {},
        relationships: {
          topCitation: { data: { id: "chunk-1", type: "chunks" }, meta: { relevance: 0.7, position: 3 } },
        },
      },
      included: [{ id: "chunk-1", type: "chunks", attributes: { content: "a" } }],
    };

    const result = new TestModel().testReadIncludedWithMeta<MockChunk, { relevance: number; position: number }>(
      data,
      "topCitation",
      chunkModule,
    ) as MockChunk & { position: number };

    expect(result).toBeInstanceOf(MockChunk);
    expect(result.relevance).toBe(0);
    expect(result.edgeRelevance).toBe(0.7);
    expect(result.position).toBe(3);
  });

  it("reads undefined from relationshipMeta when the relationship carried no meta", () => {
    const data: JsonApiHydratedDataInterface = {
      jsonApi: {
        id: "message-1",
        type: "assistant-messages",
        attributes: {},
        relationships: { citations: { data: [{ id: "chunk-1", type: "chunks" }] } },
      },
      included: [{ id: "chunk-1", type: "chunks", attributes: { content: "a" } }],
    };

    const [chunk] = new TestModel().testReadIncludedWithMeta<MockChunk, { relevance?: number }>(
      data,
      "citations",
      chunkModule,
    ) as MockChunk[];

    expect(chunk.edgeRelevance).toBeUndefined();
    expect(chunk.relevance).toBe(0);
  });

  it("keeps an inherited getter of the base class (an edge field named like one never replaces it)", () => {
    const data: JsonApiHydratedDataInterface = {
      jsonApi: {
        id: "message-1",
        type: "assistant-messages",
        attributes: {},
        relationships: { citations: { data: [{ id: "chunk-1", type: "chunks", meta: { self: "edge-self" } }] } },
      },
      included: [{ id: "chunk-1", type: "chunks", attributes: {}, links: { self: "/chunks/chunk-1" } }],
    };

    const [chunk] = new TestModel().testReadIncludedWithMeta<MockChunk, { self?: string }>(
      data,
      "citations",
      chunkModule,
    ) as MockChunk[];

    expect(chunk.self).toBe("/chunks/chunk-1");
  });

  it("keeps the getter and the edge value on the allData fallback of a single relationship", () => {
    const data: JsonApiHydratedDataInterface = {
      jsonApi: {
        id: "message-1",
        type: "assistant-messages",
        attributes: {},
        relationships: {
          topCitation: { data: { id: "chunk-9", type: "chunks" }, meta: { relevance: 0.6, reason: "fallback" } },
        },
      },
      included: [{ id: "chunk-1", type: "chunks", attributes: { content: "a" } }],
      allData: [{ id: "chunk-9", type: "chunks", attributes: { content: "z", relevance: 0.1 } }],
    };

    const chunk = new TestModel().testReadIncludedWithMeta<MockChunk, { relevance: number; reason?: string }>(
      data,
      "topCitation",
      chunkModule,
    ) as MockChunk & { reason?: string };

    expect(chunk).toBeInstanceOf(MockChunk);
    expect(chunk.relevance).toBe(0.1);
    expect(chunk.edgeRelevance).toBe(0.6);
    expect(chunk.reason).toBe("fallback");
  });
});
