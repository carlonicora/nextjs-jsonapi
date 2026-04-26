import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AbstractApiData } from "../../../../core/abstracts/AbstractApiData";
import { DataClassRegistry } from "../../../../core/registry/DataClassRegistry";
import { JsonApiHydratedDataInterface } from "../../../../core/interfaces/JsonApiHydratedDataInterface";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { Chunk } from "../Chunk";
import { resolveReferenceableModules } from "../../../assistant/utils/resolveReferenceableModules";

vi.mock("../../../assistant/utils/resolveReferenceableModules", () => ({
  resolveReferenceableModules: vi.fn(() => []),
}));

// Minimal AbstractApiData-derived class so RehydrationFactory can `new` it
// and call `instance.rehydrate(data)`.
class TestDocument extends AbstractApiData {
  static identifierFields: string[] = ["name"];

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }

  createJsonApi(_data?: any): any {
    return {};
  }
}

const testDocumentModule: ApiRequestDataTypeInterface = {
  name: "documents",
  model: TestDocument,
} as any;

beforeAll(() => {
  DataClassRegistry.clear();
  DataClassRegistry.registerObjectClass(testDocumentModule, TestDocument);
});

afterAll(() => {
  DataClassRegistry.clear();
});

describe("Chunk model", () => {
  it("rehydrates content, nodeId, nodeType from attributes", () => {
    const chunk = new Chunk();
    chunk.rehydrate({
      jsonApi: {
        id: "c1",
        type: "chunks",
        attributes: { content: "hello", nodeId: "doc-1", nodeType: "documents" },
      } as any,
      included: [],
    });
    expect(chunk.content).toBe("hello");
    expect(chunk.nodeId).toBe("doc-1");
    expect(chunk.nodeType).toBe("documents");
  });

  it("resolves the source relationship polymorphically when matching module is registered", () => {
    (resolveReferenceableModules as any).mockReturnValue([testDocumentModule]);

    const chunk = new Chunk();
    chunk.rehydrate({
      jsonApi: {
        id: "c1",
        type: "chunks",
        attributes: { content: "hello" },
        relationships: { source: { data: { type: "documents", id: "doc-1" } } },
      } as any,
      included: [{ id: "doc-1", type: "documents", attributes: { name: "Manual v1" } }],
    });
    expect(chunk.source).toBeDefined();
    expect((chunk.source as any).type).toBe("documents");
  });

  it("returns undefined source when relationship is absent", () => {
    const chunk = new Chunk();
    chunk.rehydrate({
      jsonApi: { id: "c1", type: "chunks", attributes: { content: "x" } } as any,
      included: [],
    });
    expect(chunk.source).toBeUndefined();
  });
});
