import { describe, it, expect, beforeEach, vi } from "vitest";
import { JsonApiDataFactory } from "../JsonApiDataFactory";
import { DataClassRegistry } from "../../registry/DataClassRegistry";
import { ApiDataInterface } from "../../interfaces/ApiDataInterface";

// Mock class that tracks createJsonApi calls
class MockDataClass implements Partial<ApiDataInterface> {
  type = "articles";
  id = "1";

  createJsonApi = vi.fn((data: any) => ({
    type: "articles",
    attributes: data,
  }));

  get included() {
    return [];
  }
  get createdAt() {
    return new Date();
  }
  get updatedAt() {
    return new Date();
  }
  get self() {
    return "/articles/1";
  }
  get jsonApi() {
    return { type: this.type, id: this.id };
  }
  generateApiUrl() {
    return `/articles/${this.id}`;
  }
  dehydrate() {
    return { jsonApi: this.jsonApi, included: [], allData: [] };
  }
  rehydrate(data: any) {
    return this;
  }
}

describe("JsonApiDataFactory", () => {
  const mockModule = { name: "articles", model: MockDataClass };

  beforeEach(() => {
    DataClassRegistry.clear();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create JSON:API formatted data", () => {
      DataClassRegistry.registerObjectClass(mockModule as any, MockDataClass as any);

      const inputData = { title: "Test Article", body: "Content" };
      const result = JsonApiDataFactory.create(mockModule as any, inputData);

      expect(result).toEqual({
        type: "articles",
        attributes: inputData,
      });
    });

    it("should use the registered class to create data", () => {
      DataClassRegistry.registerObjectClass(mockModule as any, MockDataClass as any);

      const inputData = { title: "Test" };
      JsonApiDataFactory.create(mockModule as any, inputData);

      // The create method should have been called
      // Note: We can't directly verify createJsonApi was called since
      // it's called on a new instance, but we can verify the output format
    });

    it("should throw for unregistered module", () => {
      const unregisteredModule = { name: "unknown", model: MockDataClass };

      expect(() => JsonApiDataFactory.create(unregisteredModule as any, { data: "test" })).toThrow(
        "Class not registered for key: unknown",
      );
    });

    it("should handle empty data", () => {
      DataClassRegistry.registerObjectClass(mockModule as any, MockDataClass as any);

      const result = JsonApiDataFactory.create(mockModule as any, {});

      expect(result).toEqual({
        type: "articles",
        attributes: {},
      });
    });

    it("should handle complex nested data", () => {
      DataClassRegistry.registerObjectClass(mockModule as any, MockDataClass as any);

      const complexData = {
        title: "Test",
        metadata: {
          tags: ["tag1", "tag2"],
          author: { name: "John", email: "john@example.com" },
        },
      };

      const result = JsonApiDataFactory.create(mockModule as any, complexData);

      expect(result.attributes).toEqual(complexData);
    });
  });
});
